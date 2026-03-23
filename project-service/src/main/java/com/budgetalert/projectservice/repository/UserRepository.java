package com.budgetalert.projectservice.repository; 
import com.budgetalert.projectservice.model.User; 
import org.springframework.data.jpa.repository.JpaRepository; 
import java.util.*; public interface UserRepository extends JpaRepository<User,String>{ Optional<User> findByEmail(String email); }
