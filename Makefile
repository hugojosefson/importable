ALL_TS_FILES := $(wildcard *.ts) $(wildcard src/**/*.ts) $(wildcard test/**/*.ts)
ALL_MD_FILES := $(wildcard *.md) $(wildcard src/**/*.md) $(wildcard test/**/*.md)
ALL_JS_FILES := $(wildcard *.js) $(wildcard src/**/*.js) $(wildcard test/**/*.js)
ALL_JSON_FILES := $(wildcard *.json) $(wildcard src/**/*.json) $(wildcard test/**/*.json)
ALL_JSONC_FILES := $(wildcard *.jsonc) $(wildcard src/**/*.jsonc) $(wildcard test/**/*.jsonc)

ALL_LINTABLE_FILES := $(ALL_TS_FILES) $(ALL_JS_FILES) $(ALL_JSON_FILES) $(ALL_JSONC_FILES)
ALL_FORMATTABLE_FILES := $(ALL_LINTABLE_FILES) $(ALL_MD_FILES)

MAIN_TS := ./main.ts
MAIN_SOURCE_TS := ./main-source.ts
ALLOWED_HOSTS_TS := ./src/allowed-hosts.ts

.PHONY: default all clean fmt lint check test

default: all
all: $(MAIN_TS) fmt README.html check lint test

$(MAIN_TS): Makefile $(ALLOWED_HOSTS_TS) $(MAIN_SOURCE_TS)
	ALLOWED_HOSTS="$$(deno eval 'console.log((await import("$(ALLOWED_HOSTS_TS)")).ALLOWED_HOSTS.join(","))')"; \
	ALLOWED_ENVS="$$(grep -oP 'Deno.env.get\("\K[^"]+' $(MAIN_SOURCE_TS) | tr '\n' ',' | sed 's/,$$//')"; \
	echo "#!/usr/bin/env -S deno run --allow-net=$${ALLOWED_HOSTS},0.0.0.0 --allow-env=$${ALLOWED_ENVS} --allow-read=README.html" > $(MAIN_TS)
	cat $(MAIN_SOURCE_TS) >> $(MAIN_TS)
	chmod +x $(MAIN_TS)

README.html: README.md
	docker run --rm -i hugojosefson/markdown < README.md > README.html

fmt: $(ALL_FORMATTABLE_FILES)
	deno fmt

check: $(ALL_LINTABLE_FILES)
	deno check $(MAIN_TS)

lint: $(ALL_LINTABLE_FILES)
	deno lint

test: $(ALL_LINTABLE_FILES) $(MAIN_TS) $(ALLOWED_HOSTS_TS)
	ALLOWED_HOSTS="$$(deno eval 'console.log((await import("$(ALLOWED_HOSTS_TS)")).ALLOWED_HOSTS.join(","))'),localhost:8080"; \
	TMP_DIR="$$(tmp_file=$$(mktemp); tmp_dir=$$(dirname $${tmp_file}); rm -f -- "$$tmp_file"; echo "$$tmp_dir")"; \
	deno test --allow-read=README.md,$${TMP_DIR} --allow-write=$${TMP_DIR} --allow-run=deno --allow-net=$${ALLOWED_HOSTS}
