# nodeEmail-cleaner

Outil CLI Node.js pour nettoyer les exports HTML Mailchimp. Supprime le code d'editeur, purge le CSS inutile, simplifie l'imbrication des tables et ajoute les wrappers Outlook.

## Prerequis

- Node.js 20+

## Installation

```bash
npm install
```

## Utilisation

### Nettoyage basique

```bash
node bin/cli.js mon-email.html -o mon-email-clean.html
```

Le fichier `mon-email-clean.html` est genere. Sans `-o`, le fichier de sortie sera `mon-email-clean.html` (suffixe `-clean` ajoute automatiquement).

### Avec stats detaillees

```bash
node bin/cli.js mon-email.html -o mon-email-clean.html -v
```

Affiche le nombre de lignes, la taille avant/apres, et le detail de chaque transformation :

```
Done! mon-email-clean.html

--- Stats ---
  Lines:  1968 -> 790 (60% reduction)
  Size:   229.8 KB -> 91.4 KB (60% reduction)

  Transforms:
    - remove-data-attrs: removed=44
    - remove-empty-tags: removed=21
    - remove-google-fonts: removed=2
    - clean-classes: classesRemoved=76, idsRemoved=54
    - clean-css: originalSize=12048, cleanedSize=5299, removed=6749
    - simplify-tables: simplified=31, passes=2
    - add-mso-wrappers: added=1
    - fix-preheader: modified=true
```

### Options

| Flag | Defaut | Description |
|------|--------|-------------|
| `-o, --output <file>` | `<input>-clean.html` | Fichier de sortie |
| `-w, --width <px>` | `660` | Largeur max pour les wrappers MSO (Outlook) |
| `--no-mso-wrappers` | — | Ne pas ajouter les wrappers MSO |
| `--no-preheader-fix` | — | Ne pas modifier le preheader |
| `--no-css-clean` | — | Ne pas purger le CSS |
| `-v, --verbose` | — | Afficher les statistiques |

### Exemples

```bash
# Largeur personnalisee (600px au lieu de 660)
node bin/cli.js input.html -o output.html -w 600

# Sans modification du preheader ni ajout de wrappers Outlook
node bin/cli.js input.html -o output.html --no-preheader-fix --no-mso-wrappers

# Nettoyage rapide, sans toucher au CSS
node bin/cli.js input.html -o output.html --no-css-clean
```

## Pipeline de transformations

Les transformations s'executent dans cet ordre :

| # | Transform | Action |
|---|-----------|--------|
| 1 | **remove-data-attrs** | Supprime tous les attributs `data-*` (`data-block-id`, `data-testid`...) |
| 2 | **remove-empty-tags** | Supprime les `<div>` vides, `<colgroup>`, `<col>` |
| 3 | **remove-google-fonts** | Supprime les `<link>` vers `fonts.googleapis.com` / `fonts.gstatic.com` |
| 4 | **clean-classes** | Supprime les classes d'editeur Mailchimp (`imageDropZone`, `mceGutterContainer`, `mceWrapper`...) et les IDs (`b5`, `d8`, `mceColumnId-*`...). Conserve `mceText`, `mcnTextContent` (portent la police et l'alignement) |
| 5 | **clean-css** | Purge les selecteurs CSS ciblant des classes/IDs d'editeur. Conserve les regles `.mceText p`, `.mceText h1`, `.mceText h2` (typographie) |
| 6 | **simplify-tables** | Reduit l'imbrication des tables (`<table><tr><td><table>` -> `<table>`) quand le wrapper n'ajoute aucun style visuel |
| 7 | **add-mso-wrappers** | Ajoute `<!--[if (gte mso 9)\|(IE)]><table width="660">` autour des sections (`mceSectionHeader`, `mceSectionBody`, `mceSectionFooter`) |
| 8 | **fix-preheader** | Ajoute le padding anti-preview `&#847;&zwnj;&nbsp;` x40 au preheader |

## Ce qui est preserve

- Images (`<img>` et leurs `src`)
- Liens (`<a href>`)
- Variables de template (`${lastname}`, `${firstname}`, etc.)
- Boutons VML pour Outlook (`v:roundrect`, `<!--[if mso]>`)
- Commentaires conditionnels MSO (`<!--[if (gte mso 9)|(IE)]>`)
- Styles inline sur les elements
- Classes de section (`mceSectionHeader`, `mceSectionBody`, `mceSectionFooter`)
- Typographie et alignement (via `.mceText` et son CSS)

## Workflow pour un nouveau fichier

1. Exporter le HTML depuis Mailchimp
2. Placer le fichier dans le dossier du projet
3. Lancer le nettoyage :
   ```bash
   node bin/cli.js nouveau-email.html -o nouveau-email-clean.html -v
   ```
4. Ouvrir `nouveau-email-clean.html` dans un navigateur et verifier le rendu
5. Tester dans les clients email cibles (Outlook, Gmail, Apple Mail, mobile)

## Tests

```bash
npm test
```

## Structure du projet

```
bin/cli.js              CLI (point d'entree)
src/
  index.js              API publique : clean(html, options)
  transforms/           8 modules de transformation
  utils/html-helpers.js Helpers cheerio reutilisables
test/
  transforms.test.js    Tests unitaires
```
