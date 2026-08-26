# Accessibility baseline — v9.1

Это технический baseline доступности, а не заявление о сертификации WCAG.

Реализовано:
- skip-link к основному содержимому;
- семантические `main`, `nav`, `region` и существующие dialog/status landmarks;
- `aria-current` для активной навигации;
- управление `aria-expanded` меню;
- клавиша Escape и возврат фокуса для install dialog;
- заметный keyboard focus;
- `prefers-reduced-motion`;
- поддержка forced-colors без отдельного визуального редизайна.

Перед enterprise procurement остаётся обязательным независимый аудит WCAG 2.2 AA с клавиатурой, VoiceOver/TalkBack/NVDA и проверкой динамически создаваемых экранов Coach/тестов.
