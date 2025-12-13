# Luganda Movies - Luganda Translated Movie Streaming Platform

A modern, responsive streaming platform dedicated to Luganda translated movies (VJ movies) built with HTML, CSS, JavaScript, and Node.js. Watch your favorite international movies dubbed in Luganda by Uganda's top VJs.

## 🎬 Features

- **Luganda Translated Content**: Exclusive collection of movies translated to Luganda
- **VJ Profiles**: Browse movies by your favorite VJ translators
- **Modern Design**: Clean, professional interface with light green color scheme
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Hero Slider**: Auto-playing carousel showcasing featured Luganda movies
- **Uganda TV Integration**: Watch local Uganda TV stations live
- **Subscription Plans**: Three-tier pricing (Free, Basic, Premium)
- **User Authentication**: Login and registration pages with validation
- **Search Functionality**: Search by movie title, VJ name, or genre
- **Quality Filters**: Filter by translation quality and video quality
- **Lazy Loading**: Optimized image loading for better performance
- **Smooth Animations**: Engaging transitions and hover effects

## 🎨 Color Scheme

- **Primary Color**: Light Green (#7CFC00) - Represents Uganda's vibrant culture
- **Secondary Color**: Cyan (#00D9FF)
- **Background**: Dark theme (#0a0a0a, #1a1a1a)
- **Text**: White (#ffffff) and Gray (#b3b3b3)

## 📁 File Structure

```
luganda-movies/
├── index.html              # Homepage with Luganda movies
├── movies.html             # Browse all Luganda movies
├── subscribe.html          # Subscription plans page
├── login.html             # User login page
├── register.html          # User registration page
├── uganda-tv.html         # Uganda TV stations
├── player.html            # Video player page
├── terms-of-service.html  # Terms of service
├── privacy-policy.html    # Privacy policy
├── css/
│   ├── style.css          # Main stylesheet
│   └── responsive.css     # Responsive design styles
├── js/
│   ├── main.js           # Main JavaScript functionality
│   ├── luganda-movies-api.js  # Luganda movies API client
│   └── uganda-tv-api.js  # Uganda TV API client
├── server/
│   ├── server.js         # Express server
│   ├── models/
│   │   ├── LugandaMovie.js   # Luganda movie model
│   │   ├── User.js           # User model
│   │   └── Payment.js        # Payment model
│   ├── controllers/
│   │   ├── lugandaMovieController.js
│   │   ├── authController.js
│   │   └── paymentController.js
│   └── routes/
│       ├── luganda-movies.js
│       ├── auth.js
│       └── payments.js
├── assets/
│   └── images/
│       ├── logo.png       # Website logo
│       └── favicon.png    # Browser favicon
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (for database)
- Your Luganda movie files

### Installation

1. **Clone or Download** this repository
```bash
git clone <repository-url>
cd luganda-movies
```

2. **Install Backend Dependencies**
```bash
cd server
npm install
```

3. **Configure Environment Variables**
Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/luganda-movies
JWT_SECRET=your_jwt_secret_key
PESAPAL_CONSUMER_KEY=your_pesapal_key
PESAPAL_CONSUMER_SECRET=your_pesapal_secret
```

4. **Start MongoDB**
```bash
mongod
```

5. **Start the Backend Server**
```bash
cd server
npm start
```

6. **Open Frontend**
Open `index.html` in your browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

Then visit `http://localhost:8000` in your browser.

### Adding Your Luganda Movies

1. Place your movie files in a designated folder (e.g., `movies/`)
2. Use the admin interface to add movie metadata
3. The system supports local file paths until you set up hosting

## 📄 Pages

### Homepage (index.html)
- Hero slider with featured Luganda movies
- Latest Luganda translations section
- Popular VJ movies
- Trending Luganda content
- Uganda TV stations quick access

### Movies (movies.html)
- Browse all Luganda translated movies
- Filter by VJ translator
- Filter by genre, year, quality
- Search functionality
- Pagination

### Uganda TV (uganda-tv.html)
- Live Uganda TV stations
- NTV, NBS, UBC, Bukedde TV, and more
- Regional stations
- Live streaming

### Subscription Plans (subscribe.html)
- Three pricing tiers: Free, Basic, Premium
- Feature comparison
- FAQ section
- Pesapal payment integration

### Login & Registration
- Email/password authentication
- User account management
- Subscription management

## 🎯 Key Features Explained

### Luganda Movie Collection
- Curated collection of movies translated to Luganda
- Original title + Luganda title display
- VJ translator credits
- Translation quality ratings
- Multiple audio tracks (Original + Luganda)

### VJ Profiles
- Browse movies by VJ translator
- VJ ratings and reviews
- Popular VJs section
- VJ translation styles

### Subscription Plans
- **Free Plan**: Limited Luganda content, SD quality, with ads
- **Basic Plan**: Full Luganda library, HD quality, ad-free, 2 devices
- **Premium Plan**: 4K quality, 4 devices, early access to new translations, unlimited downloads

### Uganda TV Integration
- Live streaming of Uganda TV stations
- Local news and entertainment
- Cultural programming in Luganda
- Regional station coverage

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 992px, 1400px, 1920px
- Touch-optimized for mobile devices
- Collapsible sidebar menu on mobile

## 🛠️ Customization

### Changing Colors
Edit the CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #7CFC00;      /* Main brand color */
    --primary-dark: #5CB300;       /* Darker shade */
    --primary-light: #9FFF33;      /* Lighter shade */
    --secondary-color: #00D9FF;    /* Accent color */
}
```

### Adding Luganda Movies
1. **Via Admin Interface**: Use the admin panel to add movie metadata
2. **Via API**: POST to `/api/luganda-movies` endpoint
3. **Database Direct**: Add documents to MongoDB collection

### Movie Data Structure
```javascript
{
    originalTitle: "Movie Title",
    lugandaTitle: "Ekyokulabirako",
    vjName: "VJ Junior",
    year: 2024,
    genre: ["action", "drama"],
    videoPath: "/path/to/movie.mp4",
    lugandaAudioPath: "/path/to/luganda-audio.mp3",
    subtitlesPath: "/path/to/subtitles.srt",
    poster: "/path/to/poster.jpg",
    quality: "hd",
    translationQuality: 4.5
}
```

### Logo
Replace `assets/images/logo.png` with your own logo (recommended size: 180x50px)

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Features

- Touch-friendly navigation
- Swipe gestures for carousel
- Optimized tap targets (44x44px minimum)
- Responsive images
- Mobile-optimized forms

## ⚡ Performance

- Lazy loading for images
- Optimized CSS and JavaScript
- Minimal external dependencies
- Fast page load times
- Smooth 60fps animations

## 🔐 Security & Legal Notes

**Important Security Measures:**

1. ✅ Backend authentication implemented (JWT)
2. ✅ Password hashing with bcrypt
3. ✅ Input validation middleware
4. ⚠️ Use HTTPS in production
5. ⚠️ Implement CSRF protection
6. ⚠️ Add rate limiting for API endpoints
7. ✅ Secure session management

**Legal Compliance:**

1. **Content Rights**: Ensure you have proper rights to distribute translated content
2. **VJ Credits**: Always credit VJ translators
3. **Original Content**: Respect original movie copyrights
4. **User Data**: Comply with data protection regulations
5. **Payment Processing**: Use licensed payment processors (Pesapal)
6. **Terms of Service**: Users must agree to terms
7. **DMCA**: Implement DMCA takedown procedures

## 📝 TODO / Future Enhancements

- [x] Backend API implementation
- [x] Luganda movie model and routes
- [ ] Video hosting solution integration
- [ ] VJ profile pages
- [ ] User watchlist functionality
- [ ] Rating and review system for translations
- [ ] Advanced search filters (by VJ, quality, genre)
- [ ] Content recommendations based on viewing history
- [ ] Mobile app (React Native)
- [ ] Offline download functionality
- [ ] Progressive Web App (PWA) features
- [ ] Multi-language support (English, Luganda, Swahili)
- [ ] Community features (comments, discussions)

## 🤝 Contributing

Feel free to fork this project and customize it for your needs!

## 📄 License

This project is open source and available for personal and commercial use.

## 👨‍💻 About

Created for Uganda's movie lovers who want to enjoy international films in their native Luganda language.

## 🙏 Acknowledgments

- **VJ Community**: Uganda's talented VJ translators who make movies accessible
- **Uganda TV Stations**: For providing local content
- Font: Inter (Google Fonts)
- Icons: Custom SVG icons
- Payment: Pesapal integration for Uganda-friendly payments

## 📞 Support

For questions, support, or to report content issues:
- Email: support@lugandamovies.com
- DMCA: dmca@lugandamovies.com

## ⚖️ Legal

- [Terms of Service](terms-of-service.html)
- [Privacy Policy](privacy-policy.html)
- [DMCA Policy](dmca.html)

---

**Note**: This platform is dedicated to promoting Luganda language and culture through translated cinema. All content must be properly licensed. VJ translators retain rights to their translations.

**Enjoy Luganda movies! 🎬🇺🇬**
