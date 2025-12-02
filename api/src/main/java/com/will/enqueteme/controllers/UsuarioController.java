package com.will.enqueteme.controllers;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.will.enqueteme.dto.CreateUserDTO;
import com.will.enqueteme.models.Usuario;
import com.will.enqueteme.repositories.UsuarioRepository;

@RestController
@RequestMapping("/user")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("")
    public String healthCheck() {
        return "Usuario endpoint ok";
    }

    @CrossOrigin(origins = "*")
    @PostMapping()
    public ResponseEntity<?> createUser(@RequestBody CreateUserDTO createUserDTO) {
        try {
            Optional<Usuario> existingUser = usuarioRepository.findByName(createUserDTO.getName());
            if (existingUser.isPresent()) {
                return ResponseEntity.ok(existingUser.get());
            }

            Usuario usuario = new Usuario();
            usuario.setName(createUserDTO.getName());
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating user: " + e.getMessage());
        }
    }
}
