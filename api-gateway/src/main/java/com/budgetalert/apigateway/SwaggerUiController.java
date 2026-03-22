package com.budgetalert.apigateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Controller
public class SwaggerUiController {
  private final ObjectMapper objectMapper;
  private final WebClient webClient;
  private final int serverPort;

  public SwaggerUiController(ObjectMapper objectMapper, @Value("${server.port:8080}") int serverPort) {
    this.objectMapper = objectMapper;
    this.serverPort = serverPort;
    this.webClient = WebClient.builder().baseUrl("http://127.0.0.1:" + serverPort).build();
  }

  @GetMapping(value = {"/swagger-ui.html", "/docs"}, produces = MediaType.TEXT_HTML_VALUE)
  @ResponseBody
  public ResponseEntity<String> swaggerUi() {
    String html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BudgetWatch API Docs</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
          <style>
            html { box-sizing: border-box; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin: 0; background: #f6f7fb; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function () {
              window.ui = SwaggerUIBundle({
                urls: [
                  { url: "/gateway-docs/project", name: "project-service" },
                  { url: "/gateway-docs/coverage", name: "coverage-service" },
                  { url: "/gateway-docs/alert", name: "alert-service" }
                ],
                "urls.primaryName": "project-service",
                dom_id: "#swagger-ui",
                deepLinking: true,
                displayRequestDuration: true,
                persistAuthorization: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
        </html>
        """;

    return ResponseEntity.ok()
        .contentType(MediaType.TEXT_HTML)
        .body(html);
  }

  @GetMapping(value = "/gateway-docs/{service}", produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseBody
  public Mono<ResponseEntity<String>> gatewayDocs(@PathVariable String service) {
    String upstreamPath = switch (service) {
      case "project" -> "/swagger/project/api-docs";
      case "coverage" -> "/swagger/coverage/api-docs";
      case "alert" -> "/swagger/alert/api-docs";
      default -> throw new IllegalArgumentException("Unknown service: " + service);
    };

    return webClient.get()
        .uri(upstreamPath)
        .retrieve()
        .bodyToMono(String.class)
        .map(body -> {
          try {
            JsonNode jsonNode = objectMapper.readTree(body);
            if (jsonNode instanceof ObjectNode rootNode) {
              ArrayNode servers = objectMapper.createArrayNode();
              ObjectNode server = objectMapper.createObjectNode();
              server.put("url", "http://localhost:" + serverPort);
              server.put("description", "API Gateway");
              servers.add(server);
              rootNode.set("servers", servers);
              body = objectMapper.writeValueAsString(rootNode);
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
          } catch (Exception exception) {
            return ResponseEntity.internalServerError()
                .contentType(MediaType.TEXT_PLAIN)
                .body("Unable to rewrite OpenAPI document");
          }
        });
  }
}
