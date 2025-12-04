package com.will.enqueteme.dto;

import java.util.Optional;

import lombok.Getter;

@Getter
public class CreateVoteDTO {
    private long pollId;
    private Long optionId;
    private Optional<Long> userId;
}
