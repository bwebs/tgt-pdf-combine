
project_name: "lkr-pdf-combine-ui"

application: lkr-pdf-combine-ui {
  label: "LKR PDF Combine"
  url: "https://localhost:8080/bundle.js"
  # file: "bundle.js
  entitlements: {
    core_api_methods: [
      "artifact",
      "search_artifacts",
      "artifact_usage",
      "dashboard",
      "login_user"
    ]
  }
}
