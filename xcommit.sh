#!/usr/bin/env bash
MSG=${*-quick update}
git add . && git commit -m "$MSG"

