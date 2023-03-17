package fi.oph.ludos

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.*

@SpringBootApplication
class LudosApplication

fun main(args: Array<String>) {
    runApplication<LudosApplication>(*args)
}

@RestController
@CrossOrigin(origins = ["http://localhost:8000"])
@RequestMapping("api")
class TaskController() {
    @GetMapping("/")
    fun index() = "{\"message\":\"hello ludos\"}"
}