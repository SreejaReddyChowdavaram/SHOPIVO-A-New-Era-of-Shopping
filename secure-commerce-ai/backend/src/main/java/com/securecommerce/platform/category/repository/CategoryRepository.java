package com.securecommerce.platform.category.repository;

import com.securecommerce.platform.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /** All active categories (for the browse filter dropdown) */
    List<Category> findByActiveTrueOrderByNameAsc();

    /** Root categories only (parent is null) */
    List<Category> findByParentIsNullAndActiveTrueOrderByNameAsc();

    Optional<Category> findBySlug(String slug);
}
