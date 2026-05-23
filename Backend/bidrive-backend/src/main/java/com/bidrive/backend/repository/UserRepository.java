package com.bidrive.backend.repository;

import com.bidrive.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

    // Подсчёт админов (для защиты от удаления последнего)
    long countByRoleId(Long roleId);

    // Проверка уникальности email
    boolean existsByEmail(String email);
}