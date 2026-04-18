require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Song = require('../models/Song');

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_MAX_RETRIES = 3;
const SPOTIFY_RETRY_DELAY_MS = 1000;

const normalize = (value) => String(value ?? '').trim().toLowerCase();

const splitAndTrim = (value, separator) =>
    String(value ?? '')
        .split(separator)
        .map((item) => item.trim())
        .filter(Boolean);

const dedupeStrings = (items) => [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getSpotifyArtistGenres = (spotifyArtist) =>
    Array.isArray(spotifyArtist?.genres) ? dedupeStrings(spotifyArtist.genres) : undefined;

const parseReleaseDate = (releaseDate) => {
    if (!releaseDate) {
        return null;
    }

    // Spotify can return YYYY, YYYY-MM, or YYYY-MM-DD.
    const parts = releaseDate.split('-');
    if (parts.length === 1) {
        return new Date(`${parts[0]}-01-01`);
    }

    if (parts.length === 2) {
        return new Date(`${parts[0]}-${parts[1]}-01`);
    }

    return new Date(releaseDate);
};

const parseReleaseYear = (releaseDate) => {
  if (!releaseDate) {
    return undefined;
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isInteger(year) ? year : undefined;
};

const getSpotifyAccessToken = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify auth failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
};

const spotifyGet = async (path, accessToken, attempt = 0) => {
    const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.status === 429 && attempt < SPOTIFY_MAX_RETRIES) {
        const retryAfterSeconds = Number(response.headers.get('retry-after'));
        const retryDelay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : SPOTIFY_RETRY_DELAY_MS * (attempt + 1);

        console.warn(`Spotify rate limit hit on ${path}. Retrying in ${retryDelay}ms.`);
        await sleep(retryDelay);
        return spotifyGet(path, accessToken, attempt + 1);
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error on ${path}: ${response.status} ${errorText}`);
    }

    return response.json();
};

const searchArtist = async (artistName, accessToken) => {
    const query = encodeURIComponent(`artist:${artistName}`);
    const data = await spotifyGet(`/search?q=${query}&type=artist&limit=10`, accessToken);
    const items = data.artists?.items || [];

    const normalizedInput = normalize(artistName);
    const exactMatches = items.filter((item) => normalize(item.name) === normalizedInput);

    if (exactMatches.length > 0) {
        return exactMatches[0];
    }

    return items[0] || null;
};

const getArtistById = async (artistId, accessToken) => spotifyGet(`/artists/${artistId}`, accessToken);

const getArtistAlbums = async (artistId, accessToken, limit = 20) => {
    const data = await spotifyGet(
        `/artists/${artistId}/albums?include_groups=album,single&limit=${limit}`,
        accessToken
    );

    return data.items || [];
};

const getAlbumTracks = async (albumId, accessToken) => {
    const tracks = [];
    let next = `/albums/${albumId}/tracks?limit=50`;

    while (next) {
        const path = next.startsWith('http') ? next.replace(SPOTIFY_API_BASE, '') : next;
        const data = await spotifyGet(path, accessToken);
        tracks.push(...(data.items || []));
        next = data.next;
    }

    return tracks;
};

const seedFromSpotify = async () => {
    const artistNames = splitAndTrim(process.env.SPOTIFY_ARTISTS, ',');

    if (artistNames.length === 0) {
        throw new Error('Set SPOTIFY_ARTISTS in .env, e.g. SPOTIFY_ARTISTS=Bad Bunny,Dua Lipa,Stromae');
    }

    const albumLimit = Number.parseInt(process.env.SPOTIFY_ALBUM_LIMIT || '5', 10);
    const resetBeforeSeed = process.env.SPOTIFY_RESET !== 'false';

    await connectDB();
    const accessToken = await getSpotifyAccessToken();

    if (resetBeforeSeed) {
        await Song.deleteMany({});
        await Album.deleteMany({});
        await Artist.deleteMany({});
    }

    const artistsBySpotifyId = new Map();
    let artistsWithoutGenres = 0;

    for (const artistName of artistNames) {
        const spotifyArtist = await searchArtist(artistName, accessToken);

        if (!spotifyArtist) {
            console.warn(`Artist not found on Spotify: ${artistName}`);
            continue;
        }

        // Use full artist profile to get richer metadata like genres.
        const spotifyArtistFull = await getArtistById(spotifyArtist.id, accessToken);
        const genres = getSpotifyArtistGenres(spotifyArtistFull);

        if (!Array.isArray(genres) || genres.length === 0) {
            artistsWithoutGenres += 1;
            console.warn(`Artist response has no Spotify genres: ${spotifyArtistFull.name}`);
        }

        artistsBySpotifyId.set(spotifyArtist.id, {
            ...spotifyArtistFull,
            genres
        });
    }

    const allAlbums = [];
    for (const spotifyArtist of artistsBySpotifyId.values()) {
        const albums = await getArtistAlbums(spotifyArtist.id, accessToken, albumLimit);

        for (const album of albums) {
            allAlbums.push({
                ...album,
                mainArtistId: spotifyArtist.id
            });
        }
    }

    // Keep only the artists explicitly requested in SPOTIFY_ARTISTS.
    const uniqueArtistNames = new Set();
    for (const spotifyArtist of artistsBySpotifyId.values()) {
        uniqueArtistNames.add(spotifyArtist.name);
    }

    const artistDocs = [];
    for (const artistName of uniqueArtistNames) {
        const knownSpotifyArtist = Array.from(artistsBySpotifyId.values()).find(
            (artist) => normalize(artist.name) === normalize(artistName)
        );

        const artistDoc = {
            name: artistName,
            country: undefined,
            birthDate: undefined
        };

        if (Number.isFinite(knownSpotifyArtist?.followers?.total)) {
            artistDoc.followers = knownSpotifyArtist.followers.total;
        }

        if (Array.isArray(knownSpotifyArtist?.genres) && knownSpotifyArtist.genres.length > 0) {
            artistDoc.genres = knownSpotifyArtist.genres;
        }

        artistDocs.push(artistDoc);
    }

    const createdArtists = await Artist.insertMany(artistDocs, { ordered: false });
    const artistsByName = new Map(createdArtists.map((artist) => [normalize(artist.name), artist]));

    const albumDocs = allAlbums
        .map((album) => {
            const mainArtist = artistsBySpotifyId.get(album.mainArtistId);
            const artistDoc = artistsByName.get(normalize(mainArtist.name));

            if (!artistDoc) {
                return null;
            }

            return {
                spotifyId: album.id,
                title: album.name,
                releaseDate: parseReleaseDate(album.release_date),
                artist: artistDoc._id,
                genre: mainArtist.genres?.[0]
            };
        })
        .filter(Boolean);

    const createdAlbums = await Album.insertMany(
        albumDocs.map(({ spotifyId, ...rest }) => rest),
        { ordered: false }
    );

    const albumIdBySpotifyId = new Map();
    for (let i = 0; i < albumDocs.length; i += 1) {
        albumIdBySpotifyId.set(albumDocs[i].spotifyId, createdAlbums[i]?._id);
    }

    const trackDocs = [];
    const insertedTrackIds = new Set();

    for (const album of allAlbums) {
        const albumObjectId = albumIdBySpotifyId.get(album.id);
        if (!albumObjectId) {
            continue;
        }

        const tracks = await getAlbumTracks(album.id, accessToken);
        const trackIds = tracks.map((track) => track.id).filter(Boolean);

        for (const track of tracks) {
            if (insertedTrackIds.has(track.id)) {
                continue;
            }

            const mainArtist = artistsBySpotifyId.get(album.mainArtistId);
            const normalizedMainArtistName = normalize(mainArtist.name);
            const trackArtistNames = (track.artists || []).map((artist) => normalize(artist.name));

            // Skip featured/collaborative songs.
            const isSoloTrackByMainArtist =
                trackArtistNames.length === 1 && trackArtistNames[0] === normalizedMainArtistName;

            if (!isSoloTrackByMainArtist) {
                continue;
            }

            const mainArtistId = artistsByName.get(normalizedMainArtistName)?._id;
            if (!mainArtistId) {
                continue;
            }

            trackDocs.push({
                title: track.name,
                duration: Math.max(1, Math.round((track.duration_ms || 0) / 1000)),
                releaseYear: parseReleaseYear(album.release_date),
                artist: mainArtistId,
                album: albumObjectId
            });

            insertedTrackIds.add(track.id);
        }
    }

    await Song.insertMany(trackDocs, { ordered: false });

    console.log('Spotify seed completed successfully.');
    console.log(`Artists inserted: ${createdArtists.length}`);
    console.log(`Albums inserted: ${createdAlbums.length}`);
    console.log(`Songs inserted: ${trackDocs.length}`);
    console.log(`Artists still missing genres: ${artistsWithoutGenres}`);
};

const run = async () => {
    try {
        await seedFromSpotify();
    } catch (error) {
        console.error('Spotify seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

run();
