#!/usr/bin/env bash
# scripts/setup.sh

pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed