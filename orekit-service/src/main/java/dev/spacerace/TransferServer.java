package dev.spacerace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Local-only HTTP bridge between the React UI and Orekit JVM.
 *
 * Run separately from the Vite frontend. Nothing is uploaded to a cloud
 * server: requests come from your own browser and are solved on your machine.
 */
public final class TransferServer {
    private static final ObjectMapper JSON = new ObjectMapper();

    private static void addCors(HttpExchange x) {
        String origin = x.getRequestHeaders().getFirst("Origin");
        if (origin != null && origin.matches("https?://(localhost|127\\.0\\.0\\.1):[0-9]{2,5}")) {
            x.getResponseHeaders().set("Access-Control-Allow-Origin",origin);
            x.getResponseHeaders().set("Vary","Origin");
        }
        x.getResponseHeaders().set("Access-Control-Allow-Methods","GET, POST, OPTIONS");
        x.getResponseHeaders().set("Access-Control-Allow-Headers","Content-Type");
        x.getResponseHeaders().set("Cache-Control","no-store");
    }

    private static void response(HttpExchange exchange, int code, Object body) throws IOException {
        byte[] bytes = JSON.writeValueAsBytes(body);
        exchange.getResponseHeaders().set("Content-Type","application/json; charset=utf-8");
        exchange.sendResponseHeaders(code,bytes.length);
        try (OutputStream out=exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    public static void main(String[] args) throws Exception {
        int port = 8787;
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1",port),0);
        server.createContext("/health", exchange -> {
            addCors(exchange);
            try {
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    exchange.sendResponseHeaders(204,-1);
                } else if (exchange.getRequestMethod().equals("GET")) {
                    response(exchange,200,Map.of(
                      "online",true,
                      "engine","Orekit 13.1.9 / Lambert",
                      "model","impulsive two-body solar transfer"
                    ));
                } else response(exchange,405,Map.of("error","Only GET permitted"));
            } finally {
                exchange.close();
            }
        });
        server.createContext("/api/lambert", exchange -> {
            addCors(exchange);
            try {
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    exchange.sendResponseHeaders(204,-1);
                } else if (!exchange.getRequestMethod().equals("POST")) {
                    response(exchange,405,Map.of("error","POST required"));
                } else {
                    try {
                        if (exchange.getRequestHeaders().getFirst("Content-Length") != null &&
                                Integer.parseInt(exchange.getRequestHeaders().getFirst("Content-Length")) > 32768) {
                            response(exchange,413,Map.of("error","Request too large"));
                        } else {
                            TransferMath.Request input = JSON.readValue(
                                    exchange.getRequestBody(), TransferMath.Request.class);
                            response(exchange,200,TransferMath.solve(input));
                        }
                    } catch (IllegalArgumentException e) {
                        response(exchange,422,Map.of("error",e.getMessage()==null?
                                "Invalid transfer geometry":e.getMessage()));
                    } catch (Exception e) {
                        // Don't expose Java internal stack traces to browser.
                        response(exchange,422,Map.of("error","Orekit could not compute this transfer; try another departure date or flight duration."));
                        System.err.println("Transfer failed: " + e.getMessage());
                    }
                }
            } finally {
                exchange.close();
            }
        });
        server.createContext("/api/optimize", exchange -> {
            addCors(exchange);
            try {
                if (exchange.getRequestMethod().equals("OPTIONS")) {
                    exchange.sendResponseHeaders(204,-1);
                } else if (!exchange.getRequestMethod().equals("POST")) {
                    response(exchange,405,Map.of("error","POST required"));
                } else {
                    // Local-only endpoint; cap request size even if Content-Length absent.
                    final byte[] payload = exchange.getRequestBody().readNBytes(262145);
                    if (payload.length > 262144) {
                        response(exchange,413,Map.of("error","Optimization request exceeds 256 KiB"));
                    } else {
                        try {
                            TransferOptimization.Request input =
                                JSON.readValue(payload,TransferOptimization.Request.class);
                            response(exchange,200,TransferOptimization.optimize(input));
                        } catch (IllegalArgumentException e) {
                            response(exchange,422,Map.of("error",e.getMessage()==null ?
                                "Invalid optimization inputs":e.getMessage()));
                        } catch (Exception e) {
                            System.err.println("Optimization failed: " + e.getMessage());
                            response(exchange,422,Map.of("error",
                                "Orekit could not optimize these transfer candidates"));
                        }
                    }
                }
            } finally {
                exchange.close();
            }
        });
        server.start();
        System.out.println("Space Race Orekit transfer server listening on http://127.0.0.1:"+port);
        System.out.println("GET /health, POST /api/lambert, POST /api/optimize; Control+C to stop.");
    }
}
