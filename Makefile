.PHONY: build_reqs deploy-function deploy-workflow-check help

help:
	@echo "Available commands:"
	@echo "  make build_reqs           - Freeze Python dependencies into requirements.txt"
	@echo "  make deploy-function      - Deploy function to Google Cloud Functions"
	@echo "  make deploy-pdf-combiner - Deploy pdf-combiner.yaml to Google Cloud"
	@echo "  make execute-pdf-combiner - Execute pdf-combiner function"
	@echo "  make execute-pdf-combiner-workflow - Execute pdf-combiner.yaml with a folder_id"
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
	env $$(cat .env | xargs) gcloud functions deploy function-pdf-combiner \
		--runtime python311 \
		--trigger-http \
		--entry-point main \
		--set-secrets LOOKERSDK_BASE_URL=LOOKERSDK_BASE_URL:latest,LOOKERSDK_CLIENT_ID=LOOKERSDK_CLIENT_ID:latest,LOOKERSDK_CLIENT_SECRET=LOOKERSDK_CLIENT_SECRET:latest,GCP_BUCKET_NAME=GCP_BUCKET_NAME:latest,PDF_COMBINER_SECRET=PDF_COMBINER_SECRET:latest \
		--memory 4096MB \
		--cpu 4 \
		--allow-unauthenticated

deploy-workflow:
	gcloud workflows deploy pdf-combiner \
		--source=pdf-combiner.yaml \
		--location=us-central1

execute-pdf-combiner-workflow: # folder_id must be passed as a variable, e.g. make execute-pdf-combiner-workflow folder_id=123
	gcloud workflows execute pdf-combiner \
		--location=us-central1 \
		--data='{"folder_id": "$(folder_id)"}'

execute-pdf-combiner:
	curl -X POST "https://us-central1-$$(gcloud config get-value project).cloudfunctions.net/function-pdf-combiner?do=execute_workflow" \
		-H "Authorization: $$(grep PDF_COMBINER_SECRET .env | cut -d '=' -f2)" \
		-H "Content-Type: application/json" \
		-d '{"folder_id": "$(folder_id)"}'


dev:
	uv run --env-file=.env functions-framework --target=main --port=8081 --debug

deploy-run:
	make deploy-function && make deploy-pdf-combiner && make execute-pdf-combiner

add-iam-policy-binding:
	gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
		--member="serviceAccount:$(gcloud iam service-accounts list --filter="email ~ compute@" --format 'value(email)')" \
		--role="roles/storage.objectViewer"
