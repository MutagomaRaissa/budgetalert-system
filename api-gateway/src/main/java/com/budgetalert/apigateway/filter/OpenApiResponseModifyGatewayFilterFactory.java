package com.budgetalert.apigateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.reactivestreams.Publisher;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class OpenApiResponseModifyGatewayFilterFactory extends AbstractGatewayFilterFactory<OpenApiResponseModifyGatewayFilterFactory.Config> {
    private final ObjectMapper objectMapper = new ObjectMapper();
    public OpenApiResponseModifyGatewayFilterFactory() { super(Config.class); }
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            if (!path.contains("api-docs")) return chain.filter(exchange);
            ServerHttpResponse originalResponse = exchange.getResponse();
            DataBufferFactory bufferFactory = originalResponse.bufferFactory();
            ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(originalResponse) {
                @Override
                public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                    if (body instanceof Flux<? extends DataBuffer> fluxBody) {
                        return DataBufferUtils.join(fluxBody).flatMap(dataBuffer -> {
                            byte[] content = new byte[dataBuffer.readableByteCount()];
                            dataBuffer.read(content);
                            DataBufferUtils.release(dataBuffer);
                            try {
                                JsonNode jsonNode = objectMapper.readTree(new String(content, StandardCharsets.UTF_8));
                                if (jsonNode instanceof ObjectNode rootNode) {
                                    ArrayNode servers = objectMapper.createArrayNode();
                                    ObjectNode server = objectMapper.createObjectNode();
                                    server.put("url", config.getBaseUrl());
                                    server.put("description", "API Gateway");
                                    servers.add(server);
                                    rootNode.set("servers", servers);
                                }
                                byte[] modified = objectMapper.writeValueAsBytes(jsonNode);
                                HttpHeaders headers = getDelegate().getHeaders();
                                headers.setContentLength(modified.length);
                                return getDelegate().writeWith(Mono.just(bufferFactory.wrap(modified)));
                            } catch (Exception e) {
                                return getDelegate().writeWith(Mono.just(bufferFactory.wrap(content)));
                            }
                        });
                    }
                    return super.writeWith(body);
                }
            };
            return chain.filter(exchange.mutate().response(decoratedResponse).build());
        };
    }
    public static class Config { private String baseUrl; public String getBaseUrl(){return baseUrl;} public void setBaseUrl(String baseUrl){this.baseUrl=baseUrl;} }
}