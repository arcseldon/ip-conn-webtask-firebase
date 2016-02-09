#!/usr/bin/env bash
MSG=${*-Cleanup}
read -p "Are you sure you want to squash with previous commit[]? " -n 1 -r
echo    # move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
  exit 1
fi
git reset --soft HEAD~2 && git commit -m "$MSG"
