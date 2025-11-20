package com.will.enqueteme.repositories;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.will.enqueteme.models.Usuario;

public interface UsuarioRepository extends CrudRepository<Usuario, Long> {
    Optional<Usuario> findByName(String name);
}
