FROM postgis/postgis:15-3.4
COPY ./dump-whodhis-202607011107.sql ./restore_DB.sql

COPY ./init-scripts/01-restore.sh ./
RUN chmod +x /01-restore.sh

# ENTRYPOINT ["/01-restore.sh"]
