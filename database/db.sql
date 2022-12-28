DROP TABLE IF EXISTS `votes`;

CREATE TABLE `votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `count` int NOT NULL DEFAULT '0',
  `start_time` datetime NULL,
  `end_time` datetime NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT INTO votes (count)
VALUES (0);
