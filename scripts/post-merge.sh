#!/bin/bash
# EduFlow post-merge setup.
# Spring Boot + Flyway handles DB schema on backend startup, so this script
# only needs to keep workspace dependencies installed.
set -e

pnpm install --prefer-frozen-lockfile
