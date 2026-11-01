import { createContext, useContext } from "react";
import type { ToolItem } from "./tools/registry";

export type Lang = "it" | "en" | "es" | "de" | "fr";

export const LANGS: Array<{ code: Lang; label: string; flag: string }> = [
  { code: "it", label: "Italiano", flag: "it" },
  { code: "en", label: "English", flag: "gb" },
  { code: "es", label: "Español", flag: "es" },
  { code: "de", label: "Deutsch", flag: "de" },
  { code: "fr", label: "Français", flag: "fr" },
];

export const LOCALES: Record<Lang, string> = { it: "it-IT", en: "en-GB", es: "es-ES", de: "de-DE", fr: "fr-FR" };

type Dict = Record<string, string>;

/** Interface strings of the landing page and the tool window. Italian is the source language. */
const UI: Record<Lang, Dict> = {
  it: {
    nav_all: "Tutti i Tool", nav_calcolo: "Calcoli", nav_convertitori: "Convertitori", nav_produttivita: "Produttività", nav_creative: "Utilità", nav_preferiti: "Preferiti",
    search: "Cerca strumento o funzione...", style: "Stile:", select_interface: "Seleziona Interfaccia",
    theme_artistic: "Minimale, stampo editoriale", theme_immersive: "Terminale cyber, dettagli neon, fosfori", theme_sophisticated: "Premium dark, angoli morbidi, sfumature",
    select_category: "Seleziona Categoria", select_category_sub: "Esplora i diversi strumenti raggruppati per tipologia di utilizzo.",
    favorites_empty: "Clicca sul cuore sui tool per salvarli qui.", back: "Indietro", category: "Categoria", tool_one: "STRUMENTO", tool_many: "STRUMENTI",
    none_found: "NESSUNO STRUMENTO TROVATO NEL SISTEMA.", reset_filters: "RIPRISTINA FILTRI", rename: "Rinomina", rename_tool: "Rinomina strumento", save: "Salva",
    fav_add: "Aggiungi ai preferiti", fav_remove: "Rimuovi dai preferiti", info_show: "Mostra spiegazioni", info_hide: "Nascondi spiegazioni",
    prev: "Precedente", next: "Successivo", tool_of: "STRUMENTO", language: "Lingua", settings: "Impostazioni", settings_close: "Chiudi impostazioni",
  },
  en: {
    nav_all: "All tools", nav_calcolo: "Calculators", nav_convertitori: "Converters", nav_produttivita: "Productivity", nav_creative: "Utilities", nav_preferiti: "Favorites",
    search: "Search tool or feature...", style: "Style:", select_interface: "Select interface",
    theme_artistic: "Minimal, editorial style", theme_immersive: "Cyber terminal, neon details, phosphor", theme_sophisticated: "Premium dark, soft corners, gradients",
    select_category: "Select category", select_category_sub: "Explore the tools grouped by type of use.",
    favorites_empty: "Click the heart on a tool to save it here.", back: "Back", category: "Category", tool_one: "TOOL", tool_many: "TOOLS",
    none_found: "NO TOOL FOUND.", reset_filters: "RESET FILTERS", rename: "Rename", rename_tool: "Rename tool", save: "Save",
    fav_add: "Add to favorites", fav_remove: "Remove from favorites", info_show: "Show explanations", info_hide: "Hide explanations",
    prev: "Previous", next: "Next", tool_of: "TOOL", language: "Language", settings: "Settings", settings_close: "Close settings",
  },
  es: {
    nav_all: "Todas las herramientas", nav_calcolo: "Cálculos", nav_convertitori: "Conversores", nav_produttivita: "Productividad", nav_creative: "Utilidades", nav_preferiti: "Favoritos",
    search: "Buscar herramienta o función...", style: "Estilo:", select_interface: "Seleccionar interfaz",
    theme_artistic: "Minimalista, estilo editorial", theme_immersive: "Terminal cibernético, detalles neón, fósforo", theme_sophisticated: "Premium oscuro, esquinas suaves, degradados",
    select_category: "Seleccionar categoría", select_category_sub: "Explora las herramientas agrupadas por tipo de uso.",
    favorites_empty: "Haz clic en el corazón de una herramienta para guardarla aquí.", back: "Atrás", category: "Categoría", tool_one: "HERRAMIENTA", tool_many: "HERRAMIENTAS",
    none_found: "NO SE ENCONTRÓ NINGUNA HERRAMIENTA.", reset_filters: "RESTABLECER FILTROS", rename: "Renombrar", rename_tool: "Renombrar herramienta", save: "Guardar",
    fav_add: "Añadir a favoritos", fav_remove: "Quitar de favoritos", info_show: "Mostrar explicaciones", info_hide: "Ocultar explicaciones",
    prev: "Anterior", next: "Siguiente", tool_of: "HERRAMIENTA", language: "Idioma", settings: "Ajustes", settings_close: "Cerrar ajustes",
  },
  de: {
    nav_all: "Alle Tools", nav_calcolo: "Rechner", nav_convertitori: "Umrechner", nav_produttivita: "Produktivität", nav_creative: "Hilfsmittel", nav_preferiti: "Favoriten",
    search: "Tool oder Funktion suchen...", style: "Stil:", select_interface: "Oberfläche wählen",
    theme_artistic: "Minimalistisch, redaktioneller Stil", theme_immersive: "Cyber-Terminal, Neon-Details, Phosphor", theme_sophisticated: "Premium dunkel, weiche Ecken, Verläufe",
    select_category: "Kategorie wählen", select_category_sub: "Entdecke die Tools, gruppiert nach Verwendungszweck.",
    favorites_empty: "Klicke auf das Herz eines Tools, um es hier zu speichern.", back: "Zurück", category: "Kategorie", tool_one: "TOOL", tool_many: "TOOLS",
    none_found: "KEIN TOOL GEFUNDEN.", reset_filters: "FILTER ZURÜCKSETZEN", rename: "Umbenennen", rename_tool: "Tool umbenennen", save: "Speichern",
    fav_add: "Zu Favoriten hinzufügen", fav_remove: "Aus Favoriten entfernen", info_show: "Erklärungen anzeigen", info_hide: "Erklärungen ausblenden",
    prev: "Zurück", next: "Weiter", tool_of: "TOOL", language: "Sprache", settings: "Einstellungen", settings_close: "Einstellungen schließen",
  },
  fr: {
    nav_all: "Tous les outils", nav_calcolo: "Calculs", nav_convertitori: "Convertisseurs", nav_produttivita: "Productivité", nav_creative: "Utilitaires", nav_preferiti: "Favoris",
    search: "Rechercher un outil ou une fonction...", style: "Style :", select_interface: "Choisir l’interface",
    theme_artistic: "Minimaliste, style éditorial", theme_immersive: "Terminal cyber, détails néon, phosphore", theme_sophisticated: "Premium sombre, coins arrondis, dégradés",
    select_category: "Choisir une catégorie", select_category_sub: "Explore les outils regroupés par type d’usage.",
    favorites_empty: "Clique sur le cœur d’un outil pour l’enregistrer ici.", back: "Retour", category: "Catégorie", tool_one: "OUTIL", tool_many: "OUTILS",
    none_found: "AUCUN OUTIL TROUVÉ.", reset_filters: "RÉINITIALISER LES FILTRES", rename: "Renommer", rename_tool: "Renommer l’outil", save: "Enregistrer",
    fav_add: "Ajouter aux favoris", fav_remove: "Retirer des favoris", info_show: "Afficher les explications", info_hide: "Masquer les explications",
    prev: "Précédent", next: "Suivant", tool_of: "OUTIL", language: "Langue", settings: "Paramètres", settings_close: "Fermer les paramètres",
  },
};

type ToolText = { name: string; description: string };

/** Tool names and descriptions for the non-Italian languages (Italian comes from the registry). */
const TOOL_TEXT: Record<Exclude<Lang, "it">, Record<string, ToolText>> = {
  en: {
    currency: { name: "Currency converter", description: "Real-time exchange rates for the main world currencies." },
    unit: { name: "Unit converter", description: "Convert length, weight, temperature, area and volume." },
    password: { name: "Password generator", description: "Create high-security passwords with adjustable options and length." },
    tip: { name: "Tips and discounts", description: "Work out discounts and tips, and split the bill per person." },
    timer: { name: "Timer & Pomodoro", description: "Run focus sessions with the Pomodoro technique or use the precision stopwatch." },
    qr: { name: "QR code generator", description: "Instantly create scannable QR codes for text, links or Wi-Fi credentials." },
    color: { name: "Color palette & picker", description: "Pick colors, see HEX/RGB/HSL codes and generate harmonious palettes." },
    decision: { name: "Decision maker", description: "Settle doubts by rolling dice, flipping a coin or drawing from a random list." },
    bmi: { name: "BMI calculator", description: "Measure body mass index, ideal weight and estimate body fat in seconds." },
    markdown: { name: "Live Markdown preview", description: "Write Markdown and see the formatted result in real time." },
    worldclock: { name: "World clock & time zones", description: "See the time around the world and simulate a future time to plan video calls." },
    age: { name: "Age & longevity calculator", description: "Find your exact age, the weekday you were born and fun stats about your heartbeats." },
    scientific_calc: { name: "Scientific calculator", description: "Run complex calculations with trigonometric and logarithmic functions and built-in memory." },
    circle_calc: { name: "Circle calculator", description: "Calculate area, circumference, diameter and radius of a circle from any measure." },
    aspect_ratio_calc: { name: "Aspect ratio calculator", description: "Calculate aspect ratios, resize resolutions and preview screens in real time." },
    case_converter: { name: "Case converter", description: "Change the text case on the fly (camelCase, snake_case, UPPERCASE, etc.)." },
    compound_interest_calc: { name: "Compound interest calculator", description: "Calculate compound interest over time with periodic deposits and compounding." },
    text_diff: { name: "Text diff", description: "Compare two texts line by line, highlighting added, removed or changed parts." },
    image_converter: { name: "Image converter", description: "Convert images between PNG, JPEG and WEBP with local resize and compression options." },
    discord_timestamp: { name: "Discord timestamps & formatting", description: "Generate dynamic Unix timestamps and special chat formatting for Discord." },
    codice_fiscale_calc: { name: "Italian tax code (Codice Fiscale)", description: "Generate the official Italian tax code from personal data and birthplace." },
    crypto_nasdaq: { name: "Crypto Top 100 & Nasdaq", description: "Live trends of the top 100 cryptocurrencies and the main NASDAQ stocks." },
    iban_validator: { name: "IBAN validator", description: "Check the format and MOD-97 check digits of a bank IBAN." },
    bg_remover: { name: "Background remover", description: "Isolate subjects, remove backgrounds and replace them with transparency or custom colors." },
    todo_checklist: { name: "To-do list & checklist", description: "Organize daily tasks, sub-checks and deadlines with priorities and progress." },
    translator: { name: "Multilingual translator", description: "Translate text into many languages with tone selection and speech." },
  },
  es: {
    currency: { name: "Conversor de divisas", description: "Tipos de cambio en tiempo real de las principales monedas del mundo." },
    unit: { name: "Conversor de unidades", description: "Convierte medidas de longitud, peso, temperatura, área y volumen." },
    password: { name: "Generador de contraseñas", description: "Crea contraseñas muy seguras con opciones y longitud ajustables." },
    tip: { name: "Propinas y descuentos", description: "Calcula descuentos y propinas, y divide la cuenta por persona." },
    timer: { name: "Temporizador y Pomodoro", description: "Gestiona sesiones de enfoque con la técnica Pomodoro o usa el cronómetro de precisión." },
    qr: { name: "Generador de códigos QR", description: "Crea al instante códigos QR para textos, enlaces o datos de Wi-Fi." },
    color: { name: "Paleta y selector de colores", description: "Elige colores, consulta los códigos HEX/RGB/HSL y genera paletas armónicas." },
    decision: { name: "Generador de decisiones", description: "Resuelve dudas lanzando dados, una moneda o eligiendo de una lista al azar." },
    bmi: { name: "Cálculo del IMC", description: "Mide el índice de masa corporal, el peso ideal y estima la grasa corporal en segundos." },
    markdown: { name: "Vista previa de Markdown", description: "Escribe en Markdown y ve el resultado formateado en tiempo real." },
    worldclock: { name: "Reloj y husos horarios", description: "Consulta la hora en todo el mundo y simula una hora futura para planificar videollamadas." },
    age: { name: "Calculadora de edad y longevidad", description: "Descubre tu edad exacta, el día de la semana en que naciste y estadísticas curiosas." },
    scientific_calc: { name: "Calculadora científica", description: "Realiza cálculos complejos con funciones trigonométricas, logarítmicas y memoria integrada." },
    circle_calc: { name: "Cálculo del círculo", description: "Calcula área, circunferencia, diámetro y radio de un círculo desde cualquier medida." },
    aspect_ratio_calc: { name: "Calculadora de relación de aspecto", description: "Calcula relaciones de aspecto, redimensiona resoluciones y previsualiza pantallas." },
    case_converter: { name: "Conversor de mayúsculas", description: "Cambia al instante el formato del texto (camelCase, snake_case, MAYÚSCULAS, etc.)." },
    compound_interest_calc: { name: "Calculadora de interés compuesto", description: "Calcula el interés compuesto con aportaciones periódicas y capitalización." },
    text_diff: { name: "Comparar textos", description: "Compara dos textos línea a línea resaltando lo añadido, eliminado o modificado." },
    image_converter: { name: "Conversor de imágenes", description: "Convierte imágenes entre PNG, JPEG y WEBP con redimensionado y compresión locales." },
    discord_timestamp: { name: "Marcas de tiempo y formato de Discord", description: "Genera marcas de tiempo Unix y estilos especiales de chat para Discord." },
    codice_fiscale_calc: { name: "Código fiscal italiano", description: "Genera el código fiscal italiano oficial a partir de los datos personales y el lugar de nacimiento." },
    crypto_nasdaq: { name: "Cripto Top 100 y Nasdaq", description: "Evolución de las 100 principales criptomonedas y de las acciones del NASDAQ." },
    iban_validator: { name: "Validador de IBAN", description: "Comprueba el formato y los dígitos de control MOD-97 de un IBAN." },
    bg_remover: { name: "Eliminar fondo", description: "Aísla sujetos, quita fondos y sustitúyelos por transparencia o colores personalizados." },
    todo_checklist: { name: "Lista de tareas", description: "Organiza tus tareas diarias, subtareas y plazos con prioridades y progreso." },
    translator: { name: "Traductor multilingüe", description: "Traduce textos a muchos idiomas con selección de tono y pronunciación." },
  },
  de: {
    currency: { name: "Währungsrechner", description: "Aktuelle Wechselkurse der wichtigsten Weltwährungen." },
    unit: { name: "Einheitenumrechner", description: "Rechne Länge, Gewicht, Temperatur, Fläche und Volumen um." },
    password: { name: "Passwort-Generator", description: "Erstelle sichere Passwörter mit einstellbaren Optionen und Länge." },
    tip: { name: "Trinkgeld und Rabatte", description: "Berechne Rabatte und Trinkgeld und teile die Rechnung pro Person." },
    timer: { name: "Timer & Pomodoro", description: "Fokussiert arbeiten mit der Pomodoro-Technik oder der Stoppuhr." },
    qr: { name: "QR-Code-Generator", description: "Erstelle sofort QR-Codes für Texte, Links oder WLAN-Zugangsdaten." },
    color: { name: "Farbpalette & Farbwähler", description: "Wähle Farben, sieh HEX/RGB/HSL-Codes und erzeuge harmonische Paletten." },
    decision: { name: "Entscheidungshilfe", description: "Entscheide per Würfel, Münzwurf oder Zufallsliste." },
    bmi: { name: "BMI-Rechner", description: "Berechne den Body-Mass-Index, das Idealgewicht und schätze das Körperfett." },
    markdown: { name: "Markdown-Vorschau live", description: "Schreibe Markdown und sieh das formatierte Ergebnis in Echtzeit." },
    worldclock: { name: "Weltzeituhr", description: "Sieh die Uhrzeit weltweit und simuliere eine spätere Zeit für Videocalls." },
    age: { name: "Alters- & Langlebigkeitsrechner", description: "Finde dein genaues Alter, deinen Geburtstag als Wochentag und kuriose Statistiken." },
    scientific_calc: { name: "Wissenschaftlicher Rechner", description: "Komplexe Berechnungen mit Winkel- und Logarithmusfunktionen und Speicher." },
    circle_calc: { name: "Kreisrechner", description: "Berechne Fläche, Umfang, Durchmesser und Radius eines Kreises aus einem beliebigen Maß." },
    aspect_ratio_calc: { name: "Seitenverhältnis-Rechner", description: "Berechne Seitenverhältnisse, skaliere Auflösungen und sieh eine Vorschau." },
    case_converter: { name: "Groß-/Kleinschreibung", description: "Ändere die Schreibweise deines Textes (camelCase, snake_case, GROSSBUCHSTABEN usw.)." },
    compound_interest_calc: { name: "Zinseszins-Rechner", description: "Berechne den Zinseszins mit regelmäßigen Einzahlungen und Verzinsung." },
    text_diff: { name: "Textvergleich", description: "Vergleiche zwei Texte zeilenweise mit Hervorhebung von Änderungen." },
    image_converter: { name: "Bildkonverter", description: "Konvertiere Bilder zwischen PNG, JPEG und WEBP mit lokaler Größen- und Kompressionsanpassung." },
    discord_timestamp: { name: "Discord-Zeitstempel & Formatierung", description: "Erzeuge dynamische Unix-Zeitstempel und Chat-Formatierungen für Discord." },
    codice_fiscale_calc: { name: "Italienische Steuernummer", description: "Erzeuge die offizielle italienische Steuernummer aus Personendaten und Geburtsort." },
    crypto_nasdaq: { name: "Krypto Top 100 & Nasdaq", description: "Verlauf der 100 wichtigsten Kryptowährungen und der NASDAQ-Aktien." },
    iban_validator: { name: "IBAN-Prüfer", description: "Prüfe Format und MOD-97-Prüfziffern einer IBAN." },
    bg_remover: { name: "Hintergrund entfernen", description: "Motive freistellen, Hintergründe entfernen und durch Transparenz oder Farben ersetzen." },
    todo_checklist: { name: "To-do-Liste & Checkliste", description: "Organisiere Aufgaben, Unteraufgaben und Fristen mit Prioritäten und Fortschritt." },
    translator: { name: "Mehrsprachiger Übersetzer", description: "Übersetze Texte in viele Sprachen mit Tonauswahl und Sprachausgabe." },
  },
  fr: {
    currency: { name: "Convertisseur de devises", description: "Taux de change en temps réel des principales monnaies du monde." },
    unit: { name: "Convertisseur d’unités", description: "Convertis longueur, poids, température, surface et volume." },
    password: { name: "Générateur de mots de passe", description: "Crée des mots de passe très sûrs avec des options et une longueur réglables." },
    tip: { name: "Pourboires et remises", description: "Calcule remises et pourboires, et partage l’addition par personne." },
    timer: { name: "Minuteur & Pomodoro", description: "Gère des sessions de concentration avec la technique Pomodoro ou le chronomètre." },
    qr: { name: "Générateur de QR code", description: "Crée instantanément des QR codes pour du texte, des liens ou des identifiants Wi-Fi." },
    color: { name: "Palette et sélecteur de couleurs", description: "Choisis des couleurs, consulte les codes HEX/RGB/HSL et génère des palettes harmonieuses." },
    decision: { name: "Aide à la décision", description: "Tranche en lançant des dés, une pièce ou en tirant dans une liste." },
    bmi: { name: "Calcul de l’IMC", description: "Mesure l’indice de masse corporelle, le poids idéal et estime la masse grasse." },
    markdown: { name: "Aperçu Markdown en direct", description: "Écris en Markdown et vois le rendu formaté en temps réel." },
    worldclock: { name: "Horloge et fuseaux horaires", description: "Consulte l’heure dans le monde et simule une heure future pour planifier des visios." },
    age: { name: "Calculateur d’âge et longévité", description: "Découvre ton âge exact, le jour de ta naissance et des statistiques amusantes." },
    scientific_calc: { name: "Calculatrice scientifique", description: "Effectue des calculs complexes avec fonctions trigonométriques, logarithmes et mémoire." },
    circle_calc: { name: "Calcul du cercle", description: "Calcule l’aire, la circonférence, le diamètre et le rayon à partir d’une mesure." },
    aspect_ratio_calc: { name: "Calculateur de ratio d’aspect", description: "Calcule les ratios, redimensionne les résolutions et prévisualise les écrans." },
    case_converter: { name: "Convertisseur de casse", description: "Change la casse du texte (camelCase, snake_case, MAJUSCULES, etc.)." },
    compound_interest_calc: { name: "Calculateur d’intérêts composés", description: "Calcule les intérêts composés avec versements périodiques et capitalisation." },
    text_diff: { name: "Comparaison de textes", description: "Compare deux textes ligne par ligne en surlignant les différences." },
    image_converter: { name: "Convertisseur d’images", description: "Convertis les images entre PNG, JPEG et WEBP avec redimensionnement et compression locaux." },
    discord_timestamp: { name: "Horodatages et mise en forme Discord", description: "Génère des horodatages Unix dynamiques et des styles de chat spéciaux pour Discord." },
    codice_fiscale_calc: { name: "Code fiscal italien", description: "Génère le code fiscal italien officiel à partir des données personnelles et du lieu de naissance." },
    crypto_nasdaq: { name: "Crypto Top 100 & Nasdaq", description: "Évolution des 100 principales cryptomonnaies et des actions du NASDAQ." },
    iban_validator: { name: "Validateur d’IBAN", description: "Vérifie le format et les chiffres de contrôle MOD-97 d’un IBAN." },
    bg_remover: { name: "Suppression d’arrière-plan", description: "Détoure des sujets, supprime les arrière-plans et remplace-les par de la transparence ou une couleur." },
    todo_checklist: { name: "Liste de tâches", description: "Organise tes tâches, sous-tâches et échéances avec priorités et progression." },
    translator: { name: "Traducteur multilingue", description: "Traduis des textes dans de nombreuses langues avec choix du ton et prononciation." },
  },
};

export function localizeTool(lang: Lang, tool: ToolItem): ToolText {
  if (lang === "it") return { name: tool.name, description: tool.description };
  return TOOL_TEXT[lang][tool.id] ?? { name: tool.name, description: tool.description };
}

export interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  toolText: (tool: ToolItem) => ToolText;
}

export const makeI18n = (lang: Lang, setLang: (lang: Lang) => void): I18n => ({
  lang,
  setLang,
  t: (key) => UI[lang][key] ?? UI.it[key] ?? key,
  toolText: (tool) => localizeTool(lang, tool),
});

export const I18nContext = createContext<I18n>(makeI18n("it", () => {}));
export const useI18n = () => useContext(I18nContext);
