package com.will.enqueteme.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.will.enqueteme.repositories.EnqueteRepository;

@RestController
@RequestMapping("/polls")
public class EnqueteController {
    @Autowired
    private EnqueteRepository enqueteRepository;

    public ResponseEntity<?> getAllPolls() {
        return ResponseEntity.ok(enqueteRepository.findAll());
    }
}
