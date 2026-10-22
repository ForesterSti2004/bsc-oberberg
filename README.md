# 1. Bowling Sport Club Oberberg e.V.

Erster responsiver Vereinsauftritt mit dem freigegebenen Logo (2003, größere Bäume). Statische HTML/CSS/JavaScript-Seite ohne Build oder externe Abhängigkeiten. Navigation, Inhaltsumschaltung, FAQ, Informationsdialoge und installierbare PWA mit Offlinezugriff.

## Lokal starten

`python3 -m http.server 8000` im Projektordner, dann http://localhost:8000 öffnen.

## Noch vom Verein zu ergänzen

- Trainingsort und Trainingszeiten
- Ansprechpartner und öffentliche Kontaktdaten
- Vorstand, Vereinsanschrift und Registerangaben
- Mitgliedsbeiträge und Aufnahmeantrag
- Tatsächliche Termine, Neuigkeiten und Mannschaften
- Vollständiges Impressum und Datenschutzerklärung

Der Entwurfsbanner und noindex bleiben bis zur inhaltlichen Freigabe bestehen. Es gibt noch keinen Adminbereich oder eine Datenbank. Keine privaten Kontaktinformationen übernommen.

## GitHub und Vercel

Dateien in ein neues Repository `bsc-oberberg` übernehmen. In Vercel importieren, Framework „Other“, kein Build-Befehl, Ausgabeordner `.`. Das bestehende Bierliga- oder Hausliga-Projekt nicht überschreiben. Bei Änderungen am Offlineumfang Cache-Version in sw.js erhöhen.
