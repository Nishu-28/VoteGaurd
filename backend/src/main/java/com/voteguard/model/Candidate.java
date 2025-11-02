package com.voteguard.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {
    
    private Long id;
    private String name;
    private String party;
    private String description;
    private Integer candidateNumber;
    private String candidatePhotoPath;
    private String partyImagePath;
    
    @Builder.Default
    private Boolean isActive = true;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Election relationship (just the ID for JDBC)
    private Long electionId;
    
    // For object relationships (populated manually in service layer)
    private Election election;
    private List<Vote> votes;
}


