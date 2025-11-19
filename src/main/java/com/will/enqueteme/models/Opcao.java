package com.will.enqueteme.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.GenerationType;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "opcoes")
@Getter
@Setter
public class Opcao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "qtde_votos", columnDefinition = "BIGINT DEFAULT 0")
    private Long votes = 0L;

    @ManyToOne
    @JoinColumn(name = "enquete_id")
    @JsonIgnore
    private Enquete enquete;
}
