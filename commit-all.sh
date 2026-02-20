#!/bin/bash

MSG=${1:-"update"}

echo "---- committing docs repo ----"
cd docs || exit
git checkout main
git add .
git commit -m "$MSG (docs)" 2>/dev/null || echo "no docs changes"
git push

echo "---- updating main repo pointer ----"
cd ..
git add docs

echo "---- committing main repo ----"
git add .
git commit -m "$MSG" 2>/dev/null || echo "no main changes"
git push

echo "✔ done"