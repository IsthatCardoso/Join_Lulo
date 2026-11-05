# LULO landing page

Website for LULO. The pages are static except for the contact handler, which requires PHP on the Simply.com web host. No database is used.

## Project structure

- `index.html` — landing page
- `who-we-are.html` — About us page
- `contact.html` — contact details
- `contact-handler.php` — validates and sends contact-form messages through Simply.com SMTP
- `private/mail-config.example.php` — example SMTP configuration; copy to `private/mail-config.php` on the host and add the mailbox password there
- `privacy.html` — privacy information
- `assets/` — active logos, favicon sources, images, and the first hero-video part
- `css/style.css` — layout, colors, and responsive styling
- `js/` — navigation, video, and language-switching behavior
- `LULO_finalvideo-hero-part2.mp4` — second hero-video part, kept in the project root
- `lixo/` — archived files that are no longer used by the website

For Simply.com, enable PHP for the website and upload the HTML and PHP files plus `assets/`, `css/`, and `js/` into `public_html`. Copy `private/mail-config.example.php` to `private/mail-config.php` in a `private/` folder alongside (outside) `public_html`, then enter the password for a Simply.com email mailbox. The handler looks for `../private/mail-config.php` first. Keep the password file outside the public website and out of shared/public source control. The sender mailbox must exist in Simply.com Mail Administration; SMTP uses `websmtp.simply.com` on port 587 with STARTTLS.

Upload the root-level second hero video as well. The `lixo/` archive and this README are not needed by the live site.
