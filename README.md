# SON IŞIK 💡 — 3D FPS Korku

> **Pil bitmeden 40 pili topla. 90×90 korku evinden kaç. Joker (1.70m) ve örümcek karanlıkta avlanıyor.**

[![Version](https://img.shields.io/badge/version-v1.0-ff1a1a?style=for-the-badge&labelColor=0a0a0f)](https://github.com/keremmkilincc-wq/SONISIK/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge&labelColor=0a0a0f)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-049ef4?style=for-the-badge&logo=three.js&labelColor=0a0a0f)](https://threejs.org)
[![Platform](https://img.shields.io/badge/platform-PC%20%2F%20Mobil-7c3aed?style=for-the-badge&labelColor=0a0a0f)](#-kontroller)

![SON IŞIK Banner](https://via.placeholder.com/1200x400/0a0505/ff1a1a?text=SON+ISIK+%E2%80%94+90x90+KORKU+EVI)

---

## ✨ Neden SON IŞIK?

* **Tek ışık = el fenerin.** Pil `%100 → 0`, fener açıkken `0.38/85ms` eriyor. Karanlıkta kalırsan canavarlar 16-18m'den duyuyor.
* **90×90 dev harita:** 4 odacık (kapıları açık), 30 engel (22 crate + 8 masa/sandalye FBX), kolonlar tavana kadar, 90'lar ahşap kapı, kan lekeli halılar.
* **2 canavar:** Joker `1.70m` (`creepy_Joker.obj` 625KB, scale `0.705`) + Örümcek pet (`Low-Poly Spider` 1.1m). Joker hep kovalar, örümcek `10 pil` sonrası kapı önünden (`1.5,-41`) uyanır. İkisi de duvarlardan geçemez.
* **Stamina + Pil yönetimi:** Koşarken `28/s` stamina gider, durunca `18/s` dolar. `WASD + SHIFT` ya da mobil joystick.

---

## 🎬 Ekran Görüntüleri

| Açılış (Ürpertici) | Karanlık Mod | Aydınlık Mod | Kaybettin |
|---|---|---|---|
| Glitch `SON IŞIK`, kan damla, `Creepster` font | Zifiri karanlık + fener | `HemisphereLight` 0.9, tavan açık | `☠️ YAKALANDIN` + bebek çığlığı |
| `90×90` `40 pil` rozetleri | `96×96` duvar kağıdı | Aynı harita aydınlık | `🚪 KAÇTIN!` yeşil |

> `BASLAT.bat` ile `http://localhost:8000` de dene, `F12` ile sis/feneri izle.

---

## 🚀 Hızlı Başlangıç

```bash
# 1) Klonla
git clone https://github.com/keremmkilincc-wq/SONISIK.git
cd SONISIK

# LFS dosyaları (modeller/müzikler)
git lfs pull

# 2) Çalıştır - Çift tık
BASLAT.bat
# veya manuel
python -m http.server 8000
# → http://localhost:8000
# → http://localhost:8000 → OYNA → WASD + Mouse
```

**APK?** `Three.js` + `Vite` yok, direkt tarayıcı. İstersen `Capacitor` ile sarılabilir.

---

## 🎮 Kontroller

| PC | Mobil |
|---|---|
| `WASD` hareket, `Mouse` bakış | Sol joystick hareket |
| `SHIFT` koş (stamina) | `🏃 KOŞ` basılı tut |
| `F` fener aç/kapa | `🔦 FENER` toggle |
| `ESC` duraklat | Sağ taraf sürükle = bakış |
| `R` tekrar (oyun sonu) | Aynı |

*Alt bar her zaman: `📱 Mobil sürüm aktif` / `🖥️ PC sürüm aktif`*
*Açılışta sağ: `⚙️ Ayarlar` + `📱 Mobil / PC` toggle*

---

## 🗺️ Harita & Oynanış

```
90×90 zemin (ahşap parke 6×6 repeat)
├─ Dış duvarlar 90×5 + kolonlar 0.85×5 her 10m + 4 köşe 1.2m kolon (tavana kadar, columnTex)
├─ 4 odacık 9×9 @ (-28,-28) kuzey kapı, (28,28) güney, (-28,28) doğu, (28,-28) batı — kapı 2.6m açık + halı
├─ 22 crate (0.9-2.3m) + 8 masa/sandalye (table.fbx 0.015) = 30 engel — collider 2.2m
├─ 40 pil silindir 0.24r ×0.52h, halka, 1.7m toplama, her biri +10 pil
├─ Çıkış kapısı 2.6×3.4 @ (0,-44.85) kuzey duvar — 40/40 pilde KIRMIZI KİLİTLİ → YEŞİL AÇIK
└─ Sis: karanlık 12/42, aydınlık 18/55, pil <25 kırmızı sis
```

**Akış:** `Açılış #11 müzik (0.85) → OYNA → #11 kapanır #23 başlar (0.55) → 10 pilde 🕷️ ÖRÜMCEK GELDİ! 5sn titrek → 40 pilde kapı yeşil → çıkışa değ → 🚪 KAÇTIN! / yakalanırsan ☠️ + bebek çığlığı (#lose 0.75)`

---

## 🔊 Sesler

| Dosya | Kaynak | Kullanım |
|---|---|---|
| `assets/opening.mp3` | `#11 Telifsiz Korku #11` (1.7MB) | Açılış ekranı loop 0.85 |
| `assets/horror.mp3` | `#23 Telifsiz Korku #23` (2.2MB) | Oyun içi loop 0.55 |
| `assets/lose.mp3` | `Bebek Çığlığı Uzun Versiyon` (1.4MB) | Kaybedince bir kez 0.75 |

`🔊/🔇` HUD mute hepsini kapatır.

---

## 🧠 Teknoloji

| Katman | Teknoloji | Not |
|---|---|---|
| **Render** | `Three.js 0.160` + `PointerLockControls` + `OBJLoader/MTLLoader/FBXLoader` | `importmap` unpkg, `antialias` + `pixelRatio 1.5`, `shadowMap OFF` perf için |
| **Modeller** | `El feneri.obj` (228KB), `creepy_Joker.obj` (625KB, 0.705 → 1.70m), `Low-Poly Spider` (217KB, 0.018 → 1.1m), `Round_table_and chairs.fbx` (198KB ×8) | `git lfs` 8.2MB |
| **Dokular** | Canvas `makeWoodTexture`/`makeWallTexture`/`makeColumnTexture`/`makeDoorTexture`/`makeCrateTexture` | Kan, yosun, çatlak prosedürel |
| **Fizik** | `colliders[] AABB` — duvar/kolon/odacık/crate/masa için `isBlocked/isRoomInside/isNearPickup` | Oyuncu `tryMove`, canavar `tryMoveEntity` |
| **UI** | `Creepster` + `Special Elite` + `Inter`, `glitch/flicker/shine/breath/spiderShake` | Açılış ve `win/lose` çok iyi |
| **Ses** | `<audio>` + `localStorage` | `sonisik_mode` + `sonisik_platform` |

---

## ⚙️ Ayarlar

Açılışta `⚙️ Ayarlar`:

* **🌙 Karanlık / ☀️ Aydınlık** — `ambient 0.22 ↔ 0.85`, `hemiLight 0 ↔ 0.9`, `fog` ve `flashlight` toggle, `localStorage sonisik_mode`
* **📖 Hakkında:** `SON IŞIK — 90×90 ... v1.0 • MIT • Three.js 0.160`
* **⭐ GitHub Reposu — keremmkilincc-wq/SONISIK**

---

## 📂 Proje Yapısı

```
SONISIK/
├─ index.html                # overlay (kan, glitch, badges) + hud + mobileControls + 3 audio
├─ assets/
│  ├─ app.js                 # 650+ satır: sahne, ışık, 40 pil, Joker/örümcek AI, stamina, çarpışma, modlar, mobil
│  ├─ style.css              # creepster, vignette, joystick, spiderAlert, go win/lose
│  ├─ horror.mp3              # #23 oyun içi
│  ├─ opening.mp3             # #11 açılış
│  ├─ lose.mp3                # bebek çığlığı kaybettin
│  ├─ BASLAT.bat              # çift tık → http.server 8000
│  └─ models/
│     ├─ flashlight.obj/.mtl
│     ├─ joker.obj/.mtl/.png (Base Color)
│     ├─ table.fbx
│     └─ spider/spider.obj/.mtl/.fbx + textures/
├─ LICENSE (MIT)
└─ README.md
```

---

## 🧪 Bilinen Sınırlar

* Joker `625KB` yüksek poli — `castShadow OFF` ile kasma azaltıldı ama düşük cihazda 90×90 + 40 ışık hâlâ ağır olabilir → `shadowMap OFF`, `crate 22` tutuldu.
* `FBX` animasyonları yoksa procedural `rotation.z/x` sallanma oynar.
* `git lfs pull` yapmadan clone'da `.fbx/.png/.mp3` pointer kalır.

---

## 🤝 Katkı

```bash
git checkout -b feat/harika
# geliştir
git commit -m "feat: harika"
git push origin feat/harika
# PR aç
```

Issue'da `F12 → Console` + `BASLAT.bat` logunu ekle.

---

## 📄 Lisans

MIT © 2026 Kerem Kilinc — [LICENSE](LICENSE)

> Telifsiz müzikler: `Telifsiz Fon Müzikleri` #11/#23 + Bebek Çığlığı (telifsiz). Modeller: `3dexport` El feneri, Creepy Joker, Round Table, Low-Poly Spider (lisanslarına uy).

**[⬆ Başa Dön](#son-işık---3d-fps-korku)**

