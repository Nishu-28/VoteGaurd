package com.voteguard.service;

import com.voteguard.model.VotingStation;
import com.voteguard.repository.VotingStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VotingStationService {

    private final VotingStationRepository votingStationRepository;

    public List<VotingStation> getAllStations() {
        return votingStationRepository.findAll();
    }

    public List<VotingStation> getUnlockedStations() {
        return votingStationRepository.findUnlockedStations();
    }

    public VotingStation getStationByCode(String stationCode) {
        return votingStationRepository.findByStationCode(stationCode)
            .orElseThrow(() -> new RuntimeException("Station not found: " + stationCode));
    }

    public VotingStation createStation(VotingStation station) {
        if (votingStationRepository.existsByStationCode(station.getStationCode())) {
            throw new RuntimeException("Station with code " + station.getStationCode() + " already exists");
        }
        
        return votingStationRepository.save(station);
    }

    public void lockStation(String stationCode) {
        VotingStation station = getStationByCode(stationCode);
        station.setIsLocked(true);
        votingStationRepository.save(station);
        log.info("Station {} locked", stationCode);
    }

    public void unlockStation(String stationCode) {
        VotingStation station = getStationByCode(stationCode);
        station.setIsLocked(false);
        votingStationRepository.save(station);
        log.info("Station {} unlocked", stationCode);
    }

    public boolean isStationUnlocked(String stationCode) {
        Optional<VotingStation> station = votingStationRepository.findByStationCode(stationCode);
        return station.isPresent() && !station.get().getIsLocked();
    }
}




