FROM golang:1.24-bookworm AS build
ARG MINIO_COMMIT=7aac2a2c5b7c882e68c1ce017d8256be2feea27f
WORKDIR /src
RUN git init && git remote add origin https://github.com/minio/minio.git && git fetch --depth=1 origin "$MINIO_COMMIT" && git checkout FETCH_HEAD
RUN CGO_ENABLED=0 go build -trimpath -o /out/minio .
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/* && useradd --uid 10001 --create-home minio && mkdir /data && chown minio:minio /data
COPY --from=build /out/minio /usr/local/bin/minio
COPY --from=build /src/LICENSE /usr/share/licenses/minio/LICENSE
COPY --from=build /src/NOTICE /usr/share/licenses/minio/NOTICE
LABEL org.opencontainers.image.source="https://github.com/minio/minio" org.opencontainers.image.revision="7aac2a2c5b7c882e68c1ce017d8256be2feea27f" org.opencontainers.image.licenses="AGPL-3.0"
USER minio
EXPOSE 9000
ENTRYPOINT ["minio"]
CMD ["server", "/data"]
