const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3002;

// 🛡️ Wstaw tutaj swoje hasło do MongoDB
const password = encodeURIComponent('Karimbenzema9');
const mongoURI = "mongodb+srv://wiczjan:karimbenzema9@cluster0.imnx9cz.mongodb.net/baza?retryWrites=true&w=majority&appName=Cluster0";

// 🔌 Połączenie z MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Połączono z MongoDB'))
    .catch((err) => console.error('❌ Błąd połączenia z MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json());

// ✉️ Endpoint: odbiera wiadomość tekstową
app.post('/api/submit-text', (req, res) => {
    const { message } = req.body;
    console.log('Received message:', message);
    res.status(200).json({ status: 'success', received: message });
});

// 📘 Schema i model do zapisu imion w kolekcji `names`
const NameSchema = new mongoose.Schema({
    name: { type: String, required: true }
});
const Name = mongoose.model('Name', NameSchema, 'names'); // wymuszona kolekcja "names"

// 🧾 Endpoint: zapisuje imię do MongoDB
app.post('/api/names', async (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Imię jest wymagane i musi być tekstem.' });
    }

    try {
        const newName = new Name({ name });
        await newName.save();
        console.log('✅ Zapisano imię:', name);
        res.status(200).json({ message: 'Imię zapisane pomyślnie', savedName: name });
    } catch (error) {
        console.error('❌ Błąd zapisu:', error);
        res.status(500).json({ error: 'Bwwłąd zapisu do bazy danych' });
    }
});

const ZgloszenieSchema = new mongoose.Schema({
    imie: String,
    nazwisko: String,
    email: String,
    telefon: String,
    wiek: Number,
    pozycja: String,
    doswiadczenie: String,
    submittedAt: { type: Date, default: Date.now }
});

const Zgloszenie = mongoose.model('Zgloszenie', ZgloszenieSchema, 'zgloszenia');

// Endpoint to handle form submission
app.post('/api/zgloszenia', async (req, res) => {
    try {
        const dane = req.body;
        const noweZgloszenie = new Zgloszenie(dane);
        await noweZgloszenie.save();
        console.log('📥 Nowe zgłoszenie zapisane:', dane);
        res.status(201).json({ message: 'Zgłoszenie zapisane pomyślnie' });
    } catch (error) {
        console.error('❌ Błąd przy zapisie zgłoszenia:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie zgłoszenia' });
    }
});
app.get('/api/zgloszenia', async (req, res) => {
    try {
        const zgloszenia = await Zgloszenie.find().sort({ createdAt: -1 });
        res.json(zgloszenia);
    } catch (error) {
        console.error('Błąd podczas pobierania zgłoszeń:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

const KontaktSchema = new mongoose.Schema({
    imie: String,
    email: String,
    telefon: String,
    problem: String,
    date: String,
    submittedAt: { type: Date, default: Date.now }
});

const Kontakt = mongoose.model('Kontakt', KontaktSchema, 'kontakty');

// Endpoint POST /api/kontakty
app.post('/api/kontakty', async (req, res) => {
    try {
        const dane = req.body;
        const nowyKontakt = new Kontakt(dane);
        await nowyKontakt.save();
        console.log('📨 Nowa wiadomość kontaktowa:', dane);
        res.status(201).json({ message: 'Kontakt zapisany pomyślnie' });
    } catch (error) {
        console.error('❌ Błąd zapisu kontaktu:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie kontaktu' });
    }
});
app.get('/api/kontakty', async (req, res) => {
    try {
        const kontakty = await Kontakt.find().sort({ submittedAt: -1 });
        res.status(200).json(kontakty);
    } catch (error) {
        console.error('❌ Błąd przy pobieraniu kontaktów:', error);
        res.status(500).json({ error: 'Błąd serwera przy pobieraniu kontaktów' });
    }
});

// Endpoint DELETE /api/kontakty/:id – usuwanie kontaktu po ID
app.delete('/api/kontakty/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Kontakt.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Nie znaleziono kontaktu o podanym ID' });
        }
        console.log(`🗑️ Usunięto kontakt o ID: ${id}`);
        res.status(200).json({ message: 'Kontakt usunięty' });
    } catch (error) {
        console.error('❌ Błąd przy usuwaniu kontaktu:', error);
        res.status(500).json({ error: 'Błąd serwera przy usuwaniu kontaktu' });
    }
});

const nodemailer = require('nodemailer');

// Konfiguracja transportera (np. Gmail lub SMTP dostawcy)
const transporter = nodemailer.createTransport({
    host: 's59.cyber-folks.pl', // ← to jest host (serwer SMTP)
    port: 465,                  // ← port do bezpiecznego połączenia SMTP
    secure: true,               // ← true dla portu 465
    auth: {
        user: 'test@playagain.pl',       // ← Twój e-mail
        pass: 'Karimbenzema9.'           // ← Hasło do skrzynki
    }
});


// Endpoint do odpowiedzi na kontakt
app.post('/api/kontakty/odpowiedz', async (req, res) => {
    const { kontaktId, trescOdpowiedzi } = req.body;

    try {
        const kontakt = await Kontakt.findById(kontaktId);

        if (!kontakt) {
            return res.status(404).json({ error: 'Nie znaleziono kontaktu' });
        }

        // Treść maila
        const mailOptions = {
            from: 'test@playagain.pl',
            to: kontakt.email,
            subject: 'Odpowiedź na Twoją wiadomość',
            text: `Dzień dobry ${kontakt.imie},\n\n${trescOdpowiedzi}\n\nPozdrawiamy,\nZespół`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Odpowiedź została wysłana.' });
    } catch (error) {
        console.error('Błąd podczas wysyłki e-maila:', error);
        res.status(500).json({ error: 'Błąd podczas wysyłania wiadomości' });
    }
});


const AktualnoscSchema = new mongoose.Schema({
    data: { type: String, required: true },
    tytul: { type: String, required: true },
    tresc: { type: String, required: true },
    zdjecie: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const Aktualnosc = mongoose.model('Aktualnosc', AktualnoscSchema, 'aktualnosci'); // wymuszenie kolekcji "aktualnosci"
app.post('/api/aktualnosci', async (req, res) => {
    try {
        const { data, tytul, tresc, zdjecie } = req.body;

        if (!data || !tytul || !tresc || !zdjecie) {
            return res.status(400).json({ error: 'Brakuje wymaganych danych.' });
        }

        const nowaAktualnosc = new Aktualnosc({ data, tytul, tresc, zdjecie });
        await nowaAktualnosc.save();

        console.log('📰 Nowa aktualność dodana:', nowaAktualnosc);
        res.status(201).json({ status: 'success', data: nowaAktualnosc });
    } catch (error) {
        console.error('❌ Błąd przy zapisie aktualności:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie aktualności.' });
    }
});

const TekstSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    tytul: { type: String, required: false }, // teraz tytul nie jest obowiązkowy
    tresc: { type: String, required: true }
});
const Tekst = mongoose.model('Tekst', TekstSchema, 'teksty');

app.put('/api/teksty/:id', async (req, res) => {
    const { id } = req.params;
    const { tytul, tresc } = req.body;

    if (!tresc || typeof tresc !== 'string') {
        return res.status(400).json({ error: 'Treść jest wymagana i musi być tekstem.' });
    }

    try {
        const updated = await Tekst.findOneAndUpdate(
            { id },
            { tytul, tresc },
            { new: true, upsert: true } // utworzy nowy dokument, jeśli nie istnieje
        );

        console.log(`✏️ Tekst z ID "${id}" został zaktualizowany.`);
        res.status(200).json({ message: 'Tekst zapisany pomyślnie', updated });
    } catch (error) {
        console.error('❌ Błąd aktualizacji tekstu:', error);
        res.status(500).json({ error: 'Błąd serwera przy zapisie tekstu.' });
    }
});

app.get('/api/teksty/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const tekst = await Tekst.findOne({ id });
        if (!tekst) {
            return res.status(404).json({ error: 'Tekst nie został znaleziony.' });
        }
        res.status(200).json(tekst);
    } catch (error) {
        console.error('❌ Błąd podczas pobierania tekstu:', error);
        res.status(500).json({ error: 'Błąd serwera.' });
    }
});


app.get('/api/aktualnosci', async (req, res) => {
    try {
        const aktualnosci = await Aktualnosc.find().sort({ submittedAt: -1 }); // sortowanie od najnowszych
        res.status(200).json(aktualnosci);
    } catch (error) {
        console.error('❌ Błąd pobierania aktualności:', error);
        res.status(500).json({ error: 'Błąd serwera przy pobieraniu aktualności.' });
    }
});


const StepSchema = new mongoose.Schema({
    title: String,
    desc: String
});

const HowToSponsor = mongoose.model('HowToSponsor', StepSchema, 'howtosponsor');

module.exports = HowToSponsor;

// Pobieranie wszystkich kroków
app.get('/api/howtosponsor', async (req, res) => {
    try {
        const steps = await HowToSponsor.find();
        res.status(200).json(steps);
    } catch (error) {
        res.status(500).json({ error: 'Błąd pobierania kroków' });
    }
});

// Nadpisywanie kroków (reset i dodanie nowych)
app.post('/api/howtosponsor', async (req, res) => {
    try {
        await HowToSponsor.deleteMany(); // czyści kolekcję
        const inserted = await HowToSponsor.insertMany(req.body.steps); // array of { title, desc }
        res.status(201).json({ message: 'Zaktualizowano kroki', inserted });
    } catch (error) {
        res.status(500).json({ error: 'Błąd zapisu kroków' });
    }
});


// 📘 Schema i model sponsora
const SponsorSchema = new mongoose.Schema({
    nazwa: { type: String, required: true },
    opis: { type: String, required: true },
    adres: { type: String, required: true },
    zdjecie: { type: String, required: true },
});

const Sponsor = mongoose.model('Sponsor', SponsorSchema, 'sponsorzy');

// ➕ Dodawanie sponsora
app.post('/api/sponsorzy', async (req, res) => {
    try {
        const nowySponsor = new Sponsor(req.body);
        await nowySponsor.save();
        res.status(201).json({ message: 'Sponsor dodany', sponsor: nowySponsor });
    } catch (error) {
        console.error('❌ Błąd dodawania sponsora:', error);
        res.status(500).json({ error: 'Błąd serwera przy dodawaniu sponsora' });
    }
});

// 📋 Pobieranie wszystkich sponsorów
app.get('/api/sponsorzy', async (req, res) => {
    try {
        const sponsorzy = await Sponsor.find();
        res.status(200).json(sponsorzy);
    } catch (error) {
        res.status(500).json({ error: 'Błąd pobierania sponsorów' });
    }
});

// ✏️ Modyfikowanie sponsora po ID
app.put('/api/sponsorzy/:id', async (req, res) => {
    try {
        const updated = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Nie znaleziono sponsora' });
        res.status(200).json({ message: 'Sponsor zaktualizowany', updated });
    } catch (error) {
        res.status(500).json({ error: 'Błąd aktualizacji sponsora' });
    }
});

// 🗑️ Usuwanie sponsora
app.delete('/api/sponsorzy/:id', async (req, res) => {
    try {
        const removed = await Sponsor.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: 'Nie znaleziono sponsora' });
        res.status(200).json({ message: 'Sponsor usunięty', removed });
    } catch (error) {
        res.status(500).json({ error: 'Błąd usuwania sponsora' });
    }
});



const EventSchema = new mongoose.Schema({
    nazwa: { type: String, required: true },
    data: { type: String, required: true },   // np. "2025-08-15"
    adres: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', EventSchema, 'wydarzenia');
app.post('/api/wydarzenia', async (req, res) => {
    try {
        const nowe = new Event(req.body);
        await nowe.save();
        res.status(201).json({ message: 'Wydarzenie dodane', wydarzenie: nowe });
    } catch (error) {
        console.error('❌ Błąd dodawania wydarzenia:', error);
        res.status(500).json({ error: 'Błąd serwera przy dodawaniu wydarzenia' });
    }
});

app.put('/api/wydarzenia/:id', async (req, res) => {
    try {
        const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Nie znaleziono wydarzenia' });
        res.status(200).json({ message: 'Wydarzenie zaktualizowane', updated });
    } catch (error) {
        res.status(500).json({ error: 'Błąd aktualizacji wydarzenia' });
    }
});
app.delete('/api/wydarzenia/:id', async (req, res) => {
    try {
        const removed = await Event.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: 'Nie znaleziono wydarzenia' });
        res.status(200).json({ message: 'Wydarzenie usunięte', removed });
    } catch (error) {
        res.status(500).json({ error: 'Błąd usuwania wydarzenia' });
    }
});

app.get('/api/wydarzenia', async (req, res) => {
    try {
        const wydarzenia = await Event.find().sort({ data: 1 }); // sortuj rosnąco wg daty
        res.status(200).json(wydarzenia);
    } catch (error) {
        res.status(500).json({ error: 'Błąd pobierania wydarzeń' });
    }
});

const relacjaSchema = new mongoose.Schema({
    tytul: { type: String, required: true },
    data: { type: String, required: true },
    opis: { type: String, required: true },
    zdjecie: { type: String, required: true }
});

const Relacja = mongoose.model('Relacja', relacjaSchema, 'relacje');
app.post("/api/relacje", async (req, res) => {
    try {
        const nowaRelacja = new Relacja(req.body);
        const saved = await nowaRelacja.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: "Błąd dodawania relacji", details: err });
    }
});

// Pobierz wszystkie relacje
app.get("/api/relacje", async (req, res) => {
    try {
        const relacje = await Relacja.find().sort({ data: -1 });
        res.json(relacje);
    } catch (err) {
        res.status(500).json({ error: "Błąd pobierania relacji", details: err });
    }
});

// Usuń relację
app.delete("/api/relacje/:id", async (req, res) => {
    try {
        await Relacja.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ error: "Błąd usuwania relacji", details: err });
    }
});

// Zaktualizuj relację
app.put("/api/relacje/:id", async (req, res) => {
    try {
        const updated = await Relacja.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: "Błąd aktualizacji relacji", details: err });
    }
});





const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');



// --- Konfiguracja Cloudinary ---
cloudinary.config({
  cloud_name: 'dkfgniqzt',
  api_key: '514784281515419',
  api_secret: 'HKufkTI72D0GYIX7zvj7OmQhGao',
});

// --- Konfiguracja Multera i Cloudinary Storage ---
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'galeria_fundacji',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});
const upload = multer({ storage });

// --- Model MongoDB ---
const galleryPhotoSchema = new mongoose.Schema({
  imageUrl: String,
  cloudinaryId: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});
const GalleryPhoto = mongoose.model('GalleryPhoto', galleryPhotoSchema);

// --- Endpointy API ---
// Pobierz wszystkie zdjęcia
app.get('/api/gallery', async (req, res) => {
  try {
    const photos = await GalleryPhoto.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania zdjęć.' });
  }
});

// Dodaj zdjęcie
app.post('/api/gallery', upload.single('image'), async (req, res) => {
  try {
    const newPhoto = new GalleryPhoto({
      imageUrl: req.file.path,
      cloudinaryId: req.file.filename,
      description: req.body.description || '',
    });
    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ error: 'Błąd dodawania zdjęcia.' });
  }
});

// Usuń zdjęcie
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const photo = await GalleryPhoto.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });
    }

    await cloudinary.uploader.destroy(photo.cloudinaryId);
    await photo.deleteOne();
    res.json({ message: 'Usunięto zdjęcie.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd usuwania zdjęcia.' });
  }
});





app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
