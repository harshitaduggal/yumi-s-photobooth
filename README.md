# yumi-s-photobooth

# Yume Booth

A browser-based photobooth web application that allows users to capture and customize photo strips with themes, frames, and real-time filters.

## Live Demo

Deployed on Vercel: https://yumi-s-photobooth.vercel.app/

---

## Overview

Yume Booth replicates a digital photobooth experience inspired by modern UI design and interactive web applications. It enables users to configure visual styles, capture multiple shots via webcam, and generate stylized photo strips directly in the browser.

---

## Features

* **Customizable Photo Experience**

  * Multiple themes and frame styles
  * Configurable number of shots per session

* **Real-Time Camera Integration**

  * Webcam access using browser APIs
  * Countdown-based capture flow

* **Filter System**

  * Multiple visual filters applied in real-time
  * Instant preview before capture

* **Dynamic UI**

  * Multi-step user flow (selection → capture → output)
  * Responsive layout using modern CSS techniques

---

## Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **APIs:** MediaDevices API (Webcam access)
* **Styling:** Custom CSS (Flexbox, Grid, animations)
* **Deployment:** Vercel

---

## Project Structure

```
yume-booth/
│── index.html   # Core application (UI + logic)
```

---

## Implementation Details

* Built as a single-page application with screen-based state transitions
* Uses DOM manipulation to dynamically update UI components
* Implements CSS-driven animations for interactive feedback
* Handles real-time video stream processing via browser APIs

---

## Future Enhancements

* Export/download functionality for photo strips
* User session storage or gallery
* Additional overlays (stickers, text elements)
* Backend integration for persistence

---

## Author

Harshita Duggal

