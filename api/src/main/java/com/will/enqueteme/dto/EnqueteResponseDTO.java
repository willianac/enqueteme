package com.will.enqueteme.dto;

import java.time.Instant;
import java.util.List;

import com.will.enqueteme.models.Enquete;
import com.will.enqueteme.models.Opcao;

import lombok.Getter;

@Getter
public class EnqueteResponseDTO {
    private Long id;
    private String title;
    private String creatorName;
    private Instant expirationDate;
    private boolean voteRequireLogin;

    private List<Opcao> options;

    public EnqueteResponseDTO(Enquete enquete) {
        this.id = enquete.getId();
        this.title = enquete.getTitle();
        this.creatorName = enquete.getUser().getName();
        this.options = enquete.getOptions();
        this.expirationDate = enquete.getExpirationDate();
        this.voteRequireLogin = enquete.isVoteRequireLogin();
    } 
}
