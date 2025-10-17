package com.voteguard.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VotingStation {
    
    private Long id;
    private String stationCode;
    @Builder.Default
    private Boolean isLocked = true;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


