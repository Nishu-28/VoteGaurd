package com.voteguard.util;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Map;

public class JdbcUtils {

    public static LocalDateTime getLocalDateTime(ResultSet rs, String columnName) throws SQLException {
        java.sql.Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    public static void setLocalDateTime(java.sql.PreparedStatement ps, int parameterIndex, LocalDateTime dateTime) throws SQLException {
        if (dateTime != null) {
            ps.setTimestamp(parameterIndex, java.sql.Timestamp.valueOf(dateTime));
        } else {
            ps.setNull(parameterIndex, java.sql.Types.TIMESTAMP);
        }
    }

    public static String mapToJsonString(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return null;
        }
        // Simple JSON serialization - in production, use a proper JSON library
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":");
            if (entry.getValue() instanceof String) {
                json.append("\"").append(entry.getValue()).append("\"");
            } else {
                json.append(entry.getValue());
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }

    public static Map<String, Object> jsonStringToMap(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return null;
        }
        // Simple JSON parsing - in production, use a proper JSON library
        // This is a basic implementation for the audit log details
        return new java.util.HashMap<>();
    }
}


