package com.voteguard.repository;

import com.voteguard.model.VotingStation;
import com.voteguard.util.JdbcUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class VotingStationRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<VotingStation> votingStationRowMapper = new RowMapper<VotingStation>() {
        @Override
        public VotingStation mapRow(ResultSet rs, int rowNum) throws SQLException {
            return VotingStation.builder()
                    .id(rs.getLong("id"))
                    .stationCode(rs.getString("station_code"))
                    .isLocked(rs.getBoolean("is_locked"))
                    .location(rs.getString("location"))
                    .createdAt(JdbcUtils.getLocalDateTime(rs, "created_at"))
                    .updatedAt(JdbcUtils.getLocalDateTime(rs, "updated_at"))
                    .build();
        }
    };

    public VotingStation save(VotingStation station) {
        if (station.getId() == null) {
            return insert(station);
        } else {
            return update(station);
        }
    }

    private VotingStation insert(VotingStation station) {
        String sql = "INSERT INTO voting_stations (station_code, is_locked, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?)";
        
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime now = LocalDateTime.now();
        
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, station.getStationCode());
            ps.setBoolean(2, station.getIsLocked());
            ps.setString(3, station.getLocation());
            JdbcUtils.setLocalDateTime(ps, 4, now);
            JdbcUtils.setLocalDateTime(ps, 5, now);
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        station.setId(id);
        station.setCreatedAt(now);
        station.setUpdatedAt(now);
        return station;
    }

    private VotingStation update(VotingStation station) {
        String sql = "UPDATE voting_stations SET station_code = ?, is_locked = ?, location = ?, updated_at = ? WHERE id = ?";
        
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update(sql, 
                station.getStationCode(), 
                station.getIsLocked(), 
                station.getLocation(), 
                now, 
                station.getId());
        
        station.setUpdatedAt(now);
        return station;
    }

    public Optional<VotingStation> findById(Long id) {
        String sql = "SELECT * FROM voting_stations WHERE id = ?";
        List<VotingStation> stations = jdbcTemplate.query(sql, votingStationRowMapper, id);
        return stations.isEmpty() ? Optional.empty() : Optional.of(stations.get(0));
    }

    public Optional<VotingStation> findByStationCode(String stationCode) {
        String sql = "SELECT * FROM voting_stations WHERE station_code = ?";
        List<VotingStation> stations = jdbcTemplate.query(sql, votingStationRowMapper, stationCode);
        return stations.isEmpty() ? Optional.empty() : Optional.of(stations.get(0));
    }

    public List<VotingStation> findByIsLocked(Boolean isLocked) {
        String sql = "SELECT * FROM voting_stations WHERE is_locked = ?";
        return jdbcTemplate.query(sql, votingStationRowMapper, isLocked);
    }

    public List<VotingStation> findUnlockedStations() {
        String sql = "SELECT * FROM voting_stations WHERE is_locked = false";
        return jdbcTemplate.query(sql, votingStationRowMapper);
    }

    public boolean existsByStationCode(String stationCode) {
        String sql = "SELECT COUNT(*) FROM voting_stations WHERE station_code = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, stationCode);
        return count != null && count > 0;
    }

    public List<VotingStation> findAll() {
        String sql = "SELECT * FROM voting_stations";
        return jdbcTemplate.query(sql, votingStationRowMapper);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM voting_stations WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}


