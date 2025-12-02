package com.will.enqueteme.repositories;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.will.enqueteme.models.Enquete;

public interface EnqueteRepository extends CrudRepository<Enquete, Long> {
    @Override
    @Query("SELECT e FROM Enquete e JOIN FETCH e.user")
    Iterable<Enquete> findAll();
}
