.PHONY: build_reqs deploy-function deploy-workflow-check help

help:
	@echo "Available commands:"
	@echo "  make build_reqs           - Freeze Python dependencies into requirements.txt"
	@echo "  make deploy-function      - Deploy function to Google Cloud Functions"
	@echo "  make deploy-workflow-check - Deploy workflow-check-bucket-permissions.yaml to Google Cloud"
	@echo "  make help                 - Show this help message"

build_reqs:
	uv pip freeze > requirements.txt 

deploy-function:
	env $$(cat .env | xargs) gcloud functions deploy function-wbr \
		--runtime python311 \
		--trigger-http \
		--set-env-vars $$(cat .env | tr '\n' ',' | sed 's/,$$//') 

deploy-workflow-check:
	gcloud workflows deploy workflow-check-folder \
		--source=workflow-check-folder.yaml \
		--location=us-central1 