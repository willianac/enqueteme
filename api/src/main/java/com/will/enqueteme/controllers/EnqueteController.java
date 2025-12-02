package com.will.enqueteme.controllers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.stream.StreamSupport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.will.enqueteme.dto.CreatePollDTO;
import com.will.enqueteme.models.Enquete;
import com.will.enqueteme.models.Opcao;
import com.will.enqueteme.models.Usuario;
import com.will.enqueteme.repositories.EnqueteRepository;
import com.will.enqueteme.repositories.UsuarioRepository;

@RestController
@RequestMapping("/polls")
public class EnqueteController {
    @Autowired
    private EnqueteRepository enqueteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @CrossOrigin(origins = "*")
    @GetMapping("")
    public ResponseEntity<?> getAllPolls() {
        Iterable<Enquete> pollsResponse = enqueteRepository.findAll();
        List<Enquete> polls = StreamSupport.stream(pollsResponse.spliterator(), false).toList();
        if(polls.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(polls);
    }

    @CrossOrigin(origins = "*")
    @PostMapping()
    public ResponseEntity<?> createPoll(@RequestBody CreatePollDTO createPollDTO) {
        if(createPollDTO.getTitle() == null || createPollDTO.getTitle().isEmpty() ||
           createPollDTO.getOptions() == null || createPollDTO.getOptions().length < 2 || 
           createPollDTO.getUserId() == null) {
            return ResponseEntity.badRequest().body("Invalid poll data. Title and at least two options are required.");
        }

        try {
            Enquete enquete = new Enquete();
            enquete.setTitle(createPollDTO.getTitle());

            List<Opcao> opcoes = Arrays.stream(createPollDTO.getOptions())
                .map(optionTitle -> {
                    Opcao opcao = new Opcao();
                    opcao.setName(optionTitle);
                    opcao.setEnquete(enquete);
                    return opcao;
                })
                .toList();

            Instant expirationTime = Instant.now().plus(
                createPollDTO.getPollExpirationInDays() != null ? createPollDTO.getPollExpirationInDays() : 7, ChronoUnit.DAYS
            );
            Usuario usuario = usuarioRepository.findById(createPollDTO.getUserId()).orElse(null);

            if(usuario == null) {
                return ResponseEntity.badRequest().body("User not found.");
            }

            enquete.setUser(usuario);
            enquete.setExpirationDate(expirationTime);
            enquete.setVoteRequireLogin(createPollDTO.isVoteRequireLogin());
            enquete.setOptions(opcoes);

            enqueteRepository.save(enquete);
            return ResponseEntity.created(null).body(enquete);
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(500).body("An error occurred while creating the poll.");
        }
    }
}
