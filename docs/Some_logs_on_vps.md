name: Логи на VPS
description: Выборка журналов сервера для анализа инцидентов и отладки.

Вот самые быстрые способы посмотреть логи на сервере (Ubuntu, systemd).

Найти имя юнита бэкенда

- systemctl list-units --type=service | grep -i portal
или 
- systemctl list-units --type=service | grep -i node

Логи бэкенда (systemd)

- последние 100 строк: sudo journalctl -u personal-portal-backend -n 100 --no-pager
- «хвост» в реальном времени: sudo journalctl -u personal-portal-backend -f
- за последние 10 минут: sudo journalctl -u personal-portal-backend --since "10 min ago"

Логи Xray

- sudo journalctl -u xray -f
- проверить статус: sudo systemctl status xray


Логи Nginx

- ошибки: sudo tail -n 200 /var/log/nginx/error.log
- доступ: sudo tail -n 200 /var/log/nginx/access.log
- через systemd: sudo journalctl -u nginx -f


Если в Docker

- контейнеры: docker ps --format 'table {{.Names}}\t{{.Status}}'
- логи: docker logs -f <container_name>


Подсказка: systemctl status personal-portal-backend сразу покажет путь к ExecStart и последние строки лога — удобно для быстрой проверки.