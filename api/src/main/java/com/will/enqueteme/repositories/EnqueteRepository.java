package com.will.enqueteme.repositories;

import org.springframework.data.repository.CrudRepository;

import com.will.enqueteme.models.Enquete;

public interface EnqueteRepository extends CrudRepository<Enquete, Long> {
}
