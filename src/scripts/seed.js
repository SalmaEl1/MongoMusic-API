require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Song = require('../models/Song');

const artistsData = [
  { name: 'Aitana' },
  { name: 'Melendi' },
  { name: 'Tawsen' },
  { name: 'Burna Boy' },
  { name: 'Dua Lipa' },
  { name: 'Stromae' },
  { name: 'Bad Bunny' }
];

const albumsData = [
  {
    key: 'alpha',
    title: 'alpha',
    releaseDate: new Date('2023-09-22'),
    artistName: 'Aitana'
  },
  {
    key: 'sin-noticias',
    title: 'Sin noticias de Holanda',
    releaseDate: new Date('2003-02-11'),
    artistName: 'Melendi'
  },
  {
    key: 'al-mawja',
    title: 'Al Mawja',
    releaseDate: new Date('2020-11-06'),
    artistName: 'Tawsen'
  },
  {
    key: 'african-giant',
    title: 'African Giant',
    releaseDate: new Date('2019-07-26'),
    artistName: 'Burna Boy'
  },
  {
    key: 'future-nostalgia',
    title: 'Future Nostalgia',
    releaseDate: new Date('2020-03-27'),
    artistName: 'Dua Lipa'
  },
  {
    key: 'multitude',
    title: 'Multitude',
    releaseDate: new Date('2022-03-04'),
    artistName: 'Stromae'
  },
  {
    key: 'yhlqmdlg',
    title: 'YHLQMDLG',
    releaseDate: new Date('2020-02-29'),
    artistName: 'Bad Bunny'
  }
];

const songsData = [
  {
    title: 'Los Angeles',
    duration: 181,
    releaseYear: 2023,
    artistName: 'Aitana',
    albumKey: 'alpha'
  },
  {
    title: 'Las Babys',
    duration: 179,
    releaseYear: 2023,
    artistName: 'Aitana',
    albumKey: 'alpha'
  },
  {
    title: 'Darari',
    duration: 191,
    releaseYear: 2023,
    artistName: 'Aitana',
    albumKey: 'alpha'
  },
  {
    title: 'Con la luna llena',
    duration: 231,
    releaseYear: 2003,
    artistName: 'Melendi',
    albumKey: 'sin-noticias'
  },
  {
    title: 'Desde mi ventana',
    duration: 213,
    releaseYear: 2003,
    artistName: 'Melendi',
    albumKey: 'sin-noticias'
  },
  {
    title: 'Mi rumbita pa tus pies',
    duration: 228,
    releaseYear: 2003,
    artistName: 'Melendi',
    albumKey: 'sin-noticias'
  },
  {
    title: 'Safe Salina',
    duration: 184,
    releaseYear: 2020,
    artistName: 'Tawsen',
    albumKey: 'al-mawja'
  },
  {
    title: 'Babour',
    duration: 201,
    releaseYear: 2020,
    artistName: 'Tawsen',
    albumKey: 'al-mawja'
  },
  {
    title: 'Habibati',
    duration: 197,
    releaseYear: 2020,
    artistName: 'Tawsen',
    albumKey: 'al-mawja'
  },
  {
    title: 'Anybody',
    duration: 188,
    releaseYear: 2019,
    artistName: 'Burna Boy',
    albumKey: 'african-giant'
  },
  {
    title: 'On the Low',
    duration: 213,
    releaseYear: 2018,
    artistName: 'Burna Boy',
    albumKey: 'african-giant'
  },
  {
    title: 'Gbona',
    duration: 188,
    releaseYear: 2018,
    artistName: 'Burna Boy',
    albumKey: 'african-giant'
  },
  {
    title: 'Levitating',
    duration: 203,
    releaseYear: 2020,
    artistName: 'Dua Lipa',
    albumKey: 'future-nostalgia'
  },
  {
    title: 'Physical',
    duration: 193,
    releaseYear: 2020,
    artistName: 'Dua Lipa',
    albumKey: 'future-nostalgia'
  },
  {
    title: 'Break My Heart',
    duration: 221,
    releaseYear: 2020,
    artistName: 'Dua Lipa',
    albumKey: 'future-nostalgia'
  },
  {
    title: 'Sante',
    duration: 191,
    releaseYear: 2021,
    artistName: 'Stromae',
    albumKey: 'multitude'
  },
  {
    title: "L'enfer",
    duration: 189,
    releaseYear: 2022,
    artistName: 'Stromae',
    albumKey: 'multitude'
  },
  {
    title: 'Fils de joie',
    duration: 236,
    releaseYear: 2022,
    artistName: 'Stromae',
    albumKey: 'multitude'
  },
  {
    title: 'Safaera',
    duration: 295,
    releaseYear: 2020,
    artistName: 'Bad Bunny',
    albumKey: 'yhlqmdlg'
  },
  {
    title: 'Yo Perreo Sola',
    duration: 173,
    releaseYear: 2020,
    artistName: 'Bad Bunny',
    albumKey: 'yhlqmdlg'
  },
  {
    title: 'La Dificil',
    duration: 163,
    releaseYear: 2020,
    artistName: 'Bad Bunny',
    albumKey: 'yhlqmdlg'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await Song.deleteMany({});
    await Album.deleteMany({});
    await Artist.deleteMany({});

    const createdArtists = await Artist.insertMany(artistsData);

    const artistsByName = new Map(createdArtists.map((artist) => [artist.name, artist]));

    const createdAlbums = await Album.insertMany(
      albumsData.map((album) => ({
        title: album.title,
        releaseDate: album.releaseDate,
        artist: artistsByName.get(album.artistName)._id
      }))
    );

    const albumsByKey = new Map(createdAlbums.map((album, index) => [albumsData[index].key, album]));

    await Song.insertMany(
      songsData.map((song) => ({
        title: song.title,
        duration: song.duration,
        releaseYear: song.releaseYear,
        artist: artistsByName.get(song.artistName)._id,
        album: albumsByKey.get(song.albumKey)._id
      }))
    );

    console.log('Seed completed successfully.');
    console.log(`Artists inserted: ${createdArtists.length}`);
    console.log(`Albums inserted: ${createdAlbums.length}`);
    console.log(`Songs inserted: ${songsData.length}`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedDatabase();
