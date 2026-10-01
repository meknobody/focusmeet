import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

/**
 * FocusMeet Java Server (Java 8+)
 * 
 * Standalone, zero-dependency HTTP server that:
 * 1. Serves the modular frontend (index.html, styles.css, app.js, tailwind.config.js)
 * 2. Provides REST API endpoints for study rooms, timer sync, and live chat
 * 
 * Compile & Run:
 *   javac FocusMeetServer.java
 *   java FocusMeetServer
 */
public class FocusMeetServer {

    private static final int PORT = 8080;
    private static final String WEB_ROOT = ".";

    public static void main(String[] args) throws IOException {
        int port = PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // REST API routes
        server.createContext("/api/status", new ApiStatusHandler());
        server.createContext("/api/health", new ApiHealthHandler());
        server.createContext("/api/rooms", new ApiRoomsHandler());
        server.createContext("/api/messages", new ApiMessagesHandler());

        // Static file handler (HTML, CSS, JS, Assets)
        server.createContext("/", new StaticFileHandler());

        // Use multi-threaded executor for handling concurrent student requests
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("=========================================================");
        System.out.println("  FocusMeet Java Server (Java 8+) Started Successfully! ");
        System.out.println("=========================================================");
        System.out.println("  -> Web App URL:      http://localhost:" + port + "/");
        System.out.println("  -> Health Check API: http://localhost:" + port + "/api/health");
        System.out.println("  -> Study Rooms API:  http://localhost:" + port + "/api/rooms");
        System.out.println("  -> Serving Files:    index.html, styles.css, app.js, tailwind.config.js");
        System.out.println("=========================================================");
        System.out.println("Press Ctrl+C to stop the server.\n");
    }

    /**
     * Serves static HTML, CSS, JS, and image files.
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Security: Prevent directory traversal
            if (path.contains("..")) {
                sendResponse(exchange, 403, "text/plain", "403 Forbidden");
                return;
            }

            File file = new File(WEB_ROOT + path);
            if (!file.exists() || file.isDirectory()) {
                sendResponse(exchange, 404, "text/html", "<h1>404 Not Found</h1><p>The requested file was not found on FocusMeet server.</p>");
                return;
            }

            String mimeType = getMimeType(file.getName());
            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache");
            exchange.sendResponseHeaders(200, file.length());

            try (OutputStream os = exchange.getResponseBody();
                 FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }
        }
    }

    /**
     * API: Server Health Status
     */
    static class ApiHealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String json = "{\"status\":\"healthy\",\"app\":\"FocusMeet\",\"server\":\"Java 8+ HttpServer\",\"timestamp\":" + System.currentTimeMillis() + "}";
            sendResponse(exchange, 200, "application/json", json);
        }
    }

    /**
     * API: Live Study Metrics & Status
     */
    static class ApiStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String json = "{"
                    + "\"status\":\"online\","
                    + "\"activeStudents\":28,"
                    + "\"activeRooms\":4,"
                    + "\"focusMinutesLogged\":1420,"
                    + "\"serverTime\":\"" + new java.util.Date().toString() + "\""
                    + "}";
            sendResponse(exchange, 200, "application/json", json);
        }
    }

    /**
     * API: Study Lounge Rooms
     */
    static class ApiRoomsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String json = "["
                    + "{\"id\":\"library\",\"name\":\"Silent Library\",\"online\":9,\"badge\":\"Deep Quiet Zone\"},"
                    + "{\"id\":\"stem\",\"name\":\"STEM & Problem Solving\",\"online\":7,\"badge\":\"Math, CS, Science\"},"
                    + "{\"id\":\"sprint\",\"name\":\"Pomodoro Sprint Club\",\"online\":8,\"badge\":\"25m Sprints\"},"
                    + "{\"id\":\"latenight\",\"name\":\"Late Night Grinders\",\"online\":5,\"badge\":\"Nocturnal Grind\"}"
                    + "]";
            sendResponse(exchange, 200, "application/json", json);
        }
    }

    /**
     * API: Community Lounge & DM Messages
     */
    static class ApiMessagesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(method)) {
                // Read request body
                StringBuilder sb = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                }
                String json = "{\"status\":\"success\",\"message\":\"Message received by FocusMeet Java server\",\"timestamp\":" + System.currentTimeMillis() + "}";
                sendResponse(exchange, 200, "application/json", json);
                return;
            }

            // Default GET: Return active messages
            String json = "["
                    + "{\"id\":\"msg_1\",\"user\":\"David Kim\",\"role\":\"Lvl 3\",\"task\":\"Python Data Structures\",\"content\":\"Starting sprint 3 on Trie structures. 25 mins no distractions!\"},"
                    + "{\"id\":\"msg_2\",\"user\":\"Maya Lin\",\"role\":\"Lvl 4\",\"task\":\"Linear Algebra\",\"content\":\"Stay locked in everyone! Linear algebra proofs almost done. 💪\"}"
                    + "]";
            sendResponse(exchange, 200, "application/json", json);
        }
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String contentType, String content) throws IOException {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType + "; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String getMimeType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".txt")) return "text/plain; charset=UTF-8";
        return "application/octet-stream";
    }
}
