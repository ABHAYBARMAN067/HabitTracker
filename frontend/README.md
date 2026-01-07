# Habit Tracker

A modern **web-based habit tracker application** that helps users track daily habits on a monthly basis. The app supports multiple views, offline storage, authentication, and optional backend persistence with MongoDB Atlas.

---

## 🚀 Features

### Core Features

* Track multiple habits (English, Typing, Coding, Aptitude, Reasoning, Exercise, Reading, Meditation, Journaling, Learning)
* Add custom habits dynamically
* Remove habits anytime
* Monthly **table view** with clickable cells to mark:

  * ✅ Done
  * ❌ Missed
  * ⬜ Not Marked
* **Calendar view** showing habits in a compact daily grid
* Toggle between **Table View** and **Calendar View**
* Navigate between months

### User Experience

* Fully responsive design (mobile + desktop)
* Share daily progress using:

  * Native Share API (supported devices)
  * Clipboard fallback
* Progress charts and achievement tracking

### Data & Storage

* Local Storage support for offline usage
* Backend integration with **MongoDB Atlas** for persistent data
* Secure user authentication (Login / Signup)

---

## 🛠️ Technologies Used

### Frontend

* React.js
* CSS / Responsive Layout

### Backend

* Node.js
* Express.js
* MongoDB (Atlas)
* Mongoose

### Authentication & Security

* JWT (JSON Web Token)
* bcrypt (Password hashing)

### Other Tools

* dotenv (Environment variables)
* CORS

---
## dependencie
npm install date-fns
npm install axios

## 📁 Project Structure (Suggested)

```
habit-tracker/
├── frontend /                # React 
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
│
├── backend/                # Backend API
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── .env
├── README.md
```

---

## 🔐 Authentication Flow

1. User signs up / logs in
2. Passwords are hashed using bcrypt
3. JWT is issued and stored on the client
4. Protected routes verify JWT

---

## 📊 Progress Tracking

* Habit completion percentage
* Daily and monthly streaks
* Achievement badges (optional extension)

---

## 🌱 Future Enhancements

* Dark mode
* Habit reminders (email / push notifications)
* Weekly & yearly analytics
* Export data as CSV / PDF
* Admin dashboard

---

## ✅ Use Cases

* Students building daily discipline
* Developers tracking learning habits
* Fitness and wellness routines
* Personal productivity tracking

---

## 📌 Conclusion

This Habit Tracker is a scalable, real-world full-stack project that demonstrates React state management, authentication, REST APIs, database design, and user-focused UI/UX. It is suitable for portfolios, internships, and production-ready extensions.
