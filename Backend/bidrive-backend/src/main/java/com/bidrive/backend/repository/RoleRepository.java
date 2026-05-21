package com.bidrive.backend.repository;

import com.bidrive.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // Стандартные методы findAll, findById, existsById уже есть в JpaRepository
}