.PHONY: build_reqs deploy-function deploy-workflow-check help

help:
	@echo "Available commands:"
	@echo "  make build_reqs           - Freeze Python dependencies into requirements.txt"
	@echo "  make deploy-function      - Deploy function to Google Cloud Functions"
	@echo "  make deploy-workflow-wbr - Deploy workflow-wbr.yaml to Google Cloud"
	@echo "  make execute-workflow-wbr - Execute workflow-wbr.yaml"
	@echo "  make dev - Run the function locally"
	@echo "  make help                 - Show this help message"

build_reqs:
	uv pip freeze > requirements.txt 

set-secrets:
	while IFS='=' read -r key value || [ -n "$$key" ]; do \
		if [[ -n "$$key" ]]; then \
			if gcloud secrets describe "$$key" >/dev/null 2>&1; then \
				printf "%s" "$$value" | gcloud secrets versions add "$$key" --data-file=-; \
				echo "Updated secret: $$key"; \
			else \
				printf "%s" "$$value" | gcloud secrets create "$$key" --data-file=- --replication-policy="automatic"; \
				echo "Created secret: $$key"; \
			fi \
		fi \
	done < .env

deploy-function:
	env $$(cat .env | xargs) gcloud functions deploy function-wbr \
		--runtime python311 \
		--trigger-http \
		--entry-point main \
		--set-secrets LOOKERSDK_BASE_URL=LOOKERSDK_BASE_URL:latest,LOOKERSDK_CLIENT_ID=LOOKERSDK_CLIENT_ID:latest,LOOKERSDK_CLIENT_SECRET=LOOKERSDK_CLIENT_SECRET:latest,GCP_BUCKET_NAME=GCP_BUCKET_NAME:latest,LOOKER_ACTION_ID=LOOKER_ACTION_ID:latest \
		--memory 4096MB \
		--cpu 4

deploy-workflow-wbr:
	gcloud workflows deploy workflow-wbr \
		--source=workflow-wbr.yaml \
		--location=us-central1

execute-workflow-wbr:
	gcloud workflows execute workflow-wbr \
		--location=us-central1

dev:
	uv run --env-file=.env functions-framework --target=main --port=8081 --debug

deploy-run:
	make deploy-function && make deploy-workflow-wbr && make execute-workflow-wbr
