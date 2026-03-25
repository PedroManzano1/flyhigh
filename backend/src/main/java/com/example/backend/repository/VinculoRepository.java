package com.example.backend.repository;

import com.example.backend.model.VinculoAlunoResponsavel;
import com.example.backend.model.VinculoId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VinculoRepository extends JpaRepository<VinculoAlunoResponsavel, VinculoId> { }