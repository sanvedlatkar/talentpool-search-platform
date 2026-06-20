# Resume Processing Queue

## Purpose

Decouple resume upload from resume processing.

## Main Queue

tps-dev-resume-processing-queue

## Dead Letter Queue

tps-dev-resume-processing-dlq

## Retry Strategy

Max receives: 3

Failed messages move to DLQ.

## Benefits

- Faster uploads
- Better user experience
- Failure isolation
- Retry support
- Operational troubleshooting