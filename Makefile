# Makefile

REPO=errajibadr
IMAGE=chatbot_mvp
PLATFORM ?= amd64
AWS_REPO=588738611726.dkr.ecr.eu-west-3.amazonaws.com/chatbot/mvp
TAG=latest

.PHONY: all build compile runtime push tag push_to_aws create_manifest help

# Default target
all: help

help:
	@echo "Usage:"
	@echo "  make compile       - Build the compile stage"
	@echo "  make runtime       - Build the runtime stage"
	@echo "  make push          - Push the images to Docker repository"
	@echo "  make tag           - Tag the image for AWS"
	@echo "  make push_to_aws   - Push the tagged image to AWS"
	@echo "  make create_manifest - Create a multi-arch manifest"
	@echo "  make all           - Build, push, tag, and push to AWS"
	@echo "  make PLATFORM=arm64 - Build for arm64 platform"

build: compile runtime

compile:
	docker pull ${REPO}/${IMAGE}-${PLATFORM}:compile-stage || true
	docker build --target compile-image \
		--platform linux/${PLATFORM} \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--cache-from=${REPO}/${IMAGE}-${PLATFORM}:compile-stage \
		--tag ${REPO}/${IMAGE}-${PLATFORM}:compile-stage .

runtime:
	docker pull ${REPO}/${IMAGE}-${PLATFORM}:latest || true
	docker build --target runtime-image \
		--platform linux/${PLATFORM} \
		--build-arg BUILDKIT_INLINE_CACHE=1 \
		--cache-from=${REPO}/${IMAGE}-${PLATFORM}:compile-stage \
		--cache-from=${REPO}/${IMAGE}-${PLATFORM}:latest \
		--tag ${REPO}/${IMAGE}-${PLATFORM}:latest .

create_manifest:
	docker manifest create ${REPO}/${IMAGE}:${TAG} \
		--amend ${REPO}/${IMAGE}-amd64:latest \
		--amend ${REPO}/${IMAGE}-arm64:latest
	docker manifest push ${REPO}/${IMAGE}:${TAG}

push:
	docker push ${REPO}/${IMAGE}-${PLATFORM}:compile-stage
	docker push ${REPO}/${IMAGE}-${PLATFORM}:latest

push_and_manifest: push create_manifest

bp: build push

bpm: build_and_push create_manifest

push_to_aws: tag
	aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin ${AWS_REPO}
	docker push ${AWS_REPO}:${TAG}

tag:
	docker tag ${REPO}/${IMAGE}-${PLATFORM}:latest ${AWS_REPO}:${TAG}

create_manifest:
	docker manifest create ${REPO}/${IMAGE}:${TAG} \
		--amend ${REPO}/${IMAGE}-amd64:latest \
		--amend ${REPO}/${IMAGE}-arm64:latest
	docker manifest push ${REPO}/${IMAGE}:${TAG}