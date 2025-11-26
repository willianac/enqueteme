package com.will.enqueteme.dto;

import lombok.Getter;

@Getter
public class CreatePollDTO {
    private String title;
    private String[] options;
    private boolean voteRequireLogin;
    private Integer pollExpirationInDays;
    private Long userId;
}
